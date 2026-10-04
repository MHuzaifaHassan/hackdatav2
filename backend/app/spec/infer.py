import json
import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import numpy as np
import pandas as pd
from pydantic import ValidationError

from backend.app.domains.packs import get_domain_pack
from backend.app.llm.prompts import DOMAIN_INFERENCE_SYSTEM_PROMPT, REPAIR_JSON_PROMPT
from backend.app.llm.provider import BaseLLMProvider, get_llm_provider
from backend.app.spec.models import (
    ColumnSpec,
    ColumnType,
    DistributionType,
    DomainSpec,
    TableSpec,
)

logger = logging.getLogger(__name__)


class SpecInferenceEngine:
    """Infers valid DomainSpecs from Prompts, CSV samples, or Domain Packs."""

    @classmethod
    async def infer_from_prompt(
        cls,
        prompt: str,
        llm: Optional[BaseLLMProvider] = None,
        max_repairs: int = 3
    ) -> DomainSpec:
        """Infers DomainSpec from natural language prompt with auto-repair and fallback."""
        if llm is None:
            llm = get_llm_provider()

        raw_json_dict: Optional[Dict[str, Any]] = None
        error_msg: Optional[str] = None

        try:
            raw_json_dict = await llm.generate_json(
                prompt=f"Generate a DomainSpec for: {prompt}",
                system_prompt=DOMAIN_INFERENCE_SYSTEM_PROMPT,
            )
            spec = DomainSpec(**raw_json_dict)
            from backend.app.spec.nlp_parser import scale_domain_spec_to_query
            return scale_domain_spec_to_query(spec, prompt)
        except (ValidationError, Exception) as e:
            error_msg = str(e)
            logger.warning(f"Initial schema inference validation failed: {error_msg}. Starting repair loop.")

        # Repair loop
        current_json = raw_json_dict or {}
        for attempt in range(max_repairs):
            try:
                repair_prompt = REPAIR_JSON_PROMPT.format(
                    error=error_msg,
                    raw_json=json.dumps(current_json, indent=2)
                )
                repaired_dict = await llm.generate_json(
                    prompt=repair_prompt,
                    system_prompt=DOMAIN_INFERENCE_SYSTEM_PROMPT
                )
                return DomainSpec(**repaired_dict)
            except (ValidationError, Exception) as rep_err:
                error_msg = str(rep_err)
                logger.warning(f"Repair attempt {attempt + 1} failed: {error_msg}")

        # Fallback to domain pack if LLM / repair failed
        logger.warning(f"[LOUD FALLBACK WARNING] LLM spec generation unavailable or failed; using domain pack fallback for prompt: '{prompt}'")
        spec = cls._fallback_to_pack(prompt)
        from backend.app.spec.nlp_parser import scale_domain_spec_to_query
        scaled_spec = scale_domain_spec_to_query(spec, prompt)
        scaled_spec.fallback_used = True
        return scaled_spec

    @classmethod
    def _fallback_to_pack(cls, prompt: str) -> DomainSpec:
        p_lower = prompt.lower()
        if any(w in p_lower for w in ["patient", "hospital", "health", "clinic", "doctor", "disease", "diagnosis", "medical", "clinical"]):
            spec = get_domain_pack("healthcare")
        elif any(w in p_lower for w in ["customer", "product", "cart", "shop", "ecommerce", "order"]):
            spec = get_domain_pack("ecommerce")
        elif any(w in p_lower for w in ["employee", "hr", "payroll", "salary", "hiring", "department", "attendance"]):
            spec = get_domain_pack("hr")
        elif any(w in p_lower for w in ["shipment", "warehouse", "logistics", "freight", "delivery"]):
            spec = get_domain_pack("logistics")
        else:
            spec = get_domain_pack("fintech")
        from backend.app.spec.nlp_parser import scale_domain_spec_to_query
        return scale_domain_spec_to_query(spec, prompt)

    @classmethod
    def infer_from_csv(
        cls,
        csv_source: Union[str, Path, pd.DataFrame],
        table_name: str = "table_1",
        domain_name: str = "custom_domain"
    ) -> DomainSpec:
        """Profiles a CSV sample and automatically constructs a high-fidelity TableSpec."""
        if isinstance(csv_source, pd.DataFrame):
            df = csv_source
        elif isinstance(csv_source, (str, Path)):
            df = pd.read_csv(csv_source)
        else:
            raise ValueError("csv_source must be a DataFrame or file path")

        columns: List[ColumnSpec] = []
        has_pk = False

        for col_name in df.columns:
            series = df[col_name]
            total_count = len(series)
            null_count = series.isna().sum()
            null_rate = float(null_count / total_count) if total_count > 0 else 0.0
            non_null = series.dropna()

            # 1. Check ID / PK
            if not has_pk and (
                col_name.lower() in ("id", f"{table_name}_id", "pk")
                or (col_name.lower().endswith("_id") and non_null.is_unique)
            ):
                columns.append(
                    ColumnSpec(
                        name=col_name,
                        type=ColumnType.ID,
                        pk=True,
                        unique=True
                    )
                )
                has_pk = True
                continue

            # 2. Check Boolean
            if pd.api.types.is_bool_dtype(non_null) or set(non_null.unique()).issubset({0, 1, "0", "1", "True", "False", "true", "false"}):
                true_count = sum(str(x).lower() in ("1", "true") for x in non_null)
                true_prob = float(true_count / len(non_null)) if len(non_null) > 0 else 0.5
                columns.append(
                    ColumnSpec(
                        name=col_name,
                        type=ColumnType.BOOLEAN,
                        null_rate=round(null_rate, 4),
                        params={"true_prob": round(true_prob, 2)}
                    )
                )
                continue

            # 3. Check Datetime / Date
            is_date = False
            if pd.api.types.is_datetime64_any_dtype(non_null):
                is_date = True
            elif (non_null.dtype == object or pd.api.types.is_string_dtype(non_null)) and len(non_null) > 0:
                sample_val = str(non_null.iloc[0])
                if re.match(r"^\d{4}-\d{2}-\d{2}", sample_val) or "date" in col_name.lower():
                    try:
                        pd.to_datetime(non_null.iloc[:20])
                        is_date = True
                    except Exception:
                        is_date = False

            if is_date:
                dt_series = pd.to_datetime(non_null)
                min_dt = dt_series.min().strftime("%Y-%m-%d")
                max_dt = dt_series.max().strftime("%Y-%m-%d")
                columns.append(
                    ColumnSpec(
                        name=col_name,
                        type=ColumnType.DATE,
                        range=[min_dt, max_dt],
                        null_rate=round(null_rate, 4)
                    )
                )
                continue

            # 4. Check Numeric (Int / Float)
            if pd.api.types.is_numeric_dtype(non_null):
                min_v = float(non_null.min())
                max_v = float(non_null.max())
                mean_v = float(non_null.mean())
                std_v = float(non_null.std()) if len(non_null) > 1 else 1.0

                if pd.api.types.is_integer_dtype(non_null) or (non_null % 1 == 0).all():
                    columns.append(
                        ColumnSpec(
                            name=col_name,
                            type=ColumnType.INT,
                            min=int(min_v),
                            max=int(max_v),
                            null_rate=round(null_rate, 4),
                            dist=DistributionType.NORMAL if std_v > 0 else DistributionType.UNIFORM,
                            params={"mean": round(mean_v, 2), "std": round(std_v, 2)}
                        )
                    )
                else:
                    columns.append(
                        ColumnSpec(
                            name=col_name,
                            type=ColumnType.FLOAT,
                            min=round(min_v, 2),
                            max=round(max_v, 2),
                            null_rate=round(null_rate, 4),
                            dist=DistributionType.NORMAL,
                            params={"mean": round(mean_v, 2), "std": round(std_v, 2)}
                        )
                    )
                continue

            # 5. Check Email
            if len(non_null) > 0 and all("@" in str(x) for x in non_null.iloc[:10]):
                columns.append(
                    ColumnSpec(
                        name=col_name,
                        type=ColumnType.EMAIL,
                        unique=non_null.is_unique,
                        null_rate=round(null_rate, 4)
                    )
                )
                continue

            # 6. Check Semantic Text / Name / Phone / Address first
            lower_name = col_name.lower()
            if "name" in lower_name:
                columns.append(
                    ColumnSpec(
                        name=col_name,
                        type=ColumnType.PERSON_NAME,
                        null_rate=round(null_rate, 4)
                    )
                )
                continue
            elif "phone" in lower_name:
                columns.append(
                    ColumnSpec(
                        name=col_name,
                        type=ColumnType.PHONE,
                        null_rate=round(null_rate, 4)
                    )
                )
                continue
            elif "address" in lower_name:
                columns.append(
                    ColumnSpec(
                        name=col_name,
                        type=ColumnType.ADDRESS,
                        null_rate=round(null_rate, 4)
                    )
                )
                continue
            elif "city" in lower_name:
                columns.append(
                    ColumnSpec(
                        name=col_name,
                        type=ColumnType.CITY,
                        null_rate=round(null_rate, 4)
                    )
                )
                continue
            elif "state" in lower_name:
                columns.append(
                    ColumnSpec(
                        name=col_name,
                        type=ColumnType.STATE,
                        null_rate=round(null_rate, 4)
                    )
                )
                continue

            # 7. Check Category vs Text
            num_unique = non_null.nunique()
            if (num_unique <= 25 and num_unique < len(non_null)) or (num_unique / max(1, len(non_null))) <= 0.20:
                counts = non_null.value_counts(normalize=True).to_dict()
                weights = {str(k): round(float(v), 3) for k, v in counts.items()}
                columns.append(
                    ColumnSpec(
                        name=col_name,
                        type=ColumnType.CATEGORY,
                        values=weights,
                        null_rate=round(null_rate, 4)
                    )
                )
            else:
                columns.append(
                    ColumnSpec(
                        name=col_name,
                        type=ColumnType.TEXT_PLACEHOLDER,
                        null_rate=round(null_rate, 4)
                    )
                )

        # Ensure at least one PK exists
        if not has_pk and columns:
            columns.insert(0, ColumnSpec(name=f"{table_name}_id", type=ColumnType.ID, pk=True))

        table_spec = TableSpec(
            name=table_name,
            rows=len(df),
            columns=columns
        )

        return DomainSpec(
            domain=domain_name,
            tables=[table_spec]
        )
