import datetime
import math
import re
import uuid
from typing import Any, Dict, List, Optional, Set, Tuple, Union

import numpy as np
import pandas as pd
from faker import Faker

from backend.app.engines.edgecases import EdgeCasesInjector
from backend.app.engines.locales import LocaleManager
from backend.app.engines.privacy import PrivacyEngine
from backend.app.spec.errors import ImpossibleQuantityError
from backend.app.spec.models import (
    ColumnSpec,
    ColumnType,
    DistributionType,
    DomainSpec,
    TableSpec,
)


class TabularEngine:
    """Deterministic, high-performance tabular synthetic data generator."""

    def __init__(self, locale: str = "en_US", default_currency: str = "USD"):
        norm_locale, default_curr = LocaleManager.normalize_locale(locale)
        self.locale = norm_locale
        self.default_currency = default_currency if default_currency != "USD" else default_curr

    def generate_table(
        self,
        table_spec: TableSpec,
        seed: int = 42,
        global_edge_cases: Optional[Any] = None
    ) -> pd.DataFrame:
        """Generates a Pandas DataFrame adhering strictly to TableSpec and seed."""
        n_rows = table_spec.rows

        # Validate feasibility (impossible constraint check)
        for col in table_spec.columns:
            if col.unique:
                if col.type == ColumnType.CATEGORY and col.values:
                    possible = len(col.values) if isinstance(col.values, (list, dict)) else 1
                    if n_rows > possible:
                        raise ImpossibleQuantityError(
                            requested=n_rows,
                            possible=possible,
                            column=col.name,
                            reason=f"Column '{col.name}' is constrained to unique but only has {possible} possible categorical values."
                        )
                elif col.type == ColumnType.BOOLEAN and n_rows > 2:
                    raise ImpossibleQuantityError(
                        requested=n_rows,
                        possible=2,
                        column=col.name,
                        reason=f"Column '{col.name}' is boolean with unique constraint (maximum 2 possible values)."
                    )

        rng = np.random.default_rng(seed)
        try:
            faker = Faker([self.locale, "en_US"])
        except Exception:
            faker = Faker("en_US")
        faker.seed_instance(seed)

        data: Dict[str, Any] = {}

        # 1. First pass: Generate base columns (non-derived)
        derived_cols: List[ColumnSpec] = []
        for col in table_spec.columns:
            if col.derive_from:
                derived_cols.append(col)
                continue
            data[col.name] = self._generate_base_column(col, n_rows, rng, faker)

        # Create intermediate DataFrame to allow column derivation
        df = pd.DataFrame(data)

        # 2. Second pass: Generate derived columns
        for col in derived_cols:
            df[col.name] = self._generate_derived_column(col, df, n_rows, rng, faker)

        # 3. Third pass: Apply edge cases (nulls, outliers, unicode)
        for col in table_spec.columns:
            # Null rate: column-level overrides global edge-case
            null_rate = col.null_rate
            if null_rate is None and global_edge_cases:
                null_rate = getattr(global_edge_cases, "null_rate", 0.0)
            if null_rate and null_rate > 0.0 and not col.pk:
                df[col.name] = EdgeCasesInjector.inject_nulls(df[col.name], null_rate, rng)

            # Outlier rate
            outlier_rate = col.outlier_rate
            if outlier_rate is None and global_edge_cases:
                outlier_rate = getattr(global_edge_cases, "outlier_rate", 0.0)
            if outlier_rate and outlier_rate > 0.0 and col.type in (ColumnType.INT, ColumnType.FLOAT):
                is_int = col.type == ColumnType.INT
                df[col.name] = EdgeCasesInjector.inject_outliers(df[col.name], outlier_rate, rng, is_int=is_int)

            # Unicode names if requested in global edge cases
            if global_edge_cases and getattr(global_edge_cases, "unicode_names", False):
                if col.type in (ColumnType.PERSON_NAME, ColumnType.FIRST_NAME, ColumnType.LAST_NAME) or (
                    "name" in col.name.lower() and col.type not in (ColumnType.ID, ColumnType.INT, ColumnType.FLOAT, ColumnType.DATE, ColumnType.DATETIME, ColumnType.BOOLEAN)
                ):
                    df[col.name] = EdgeCasesInjector.inject_unicode_names(df[col.name], 0.20, rng)

        # 4. Fourth pass: Apply privacy transformations (mask / hash / noise)
        global_mask = getattr(global_edge_cases, "mask_emails", False) if global_edge_cases else False
        global_hash = getattr(global_edge_cases, "hash_secrets", False) if global_edge_cases else False

        for col in table_spec.columns:
            # If explicit column privacy is defined
            if col.privacy:
                is_int = col.type == ColumnType.INT
                df[col.name] = PrivacyEngine.apply_column_privacy(
                    df[col.name], col.privacy, rng, is_int=is_int
                )
            # Global privacy suite fallbacks
            elif global_mask and (col.type == ColumnType.EMAIL or "email" in col.name.lower()):
                df[col.name] = PrivacyEngine.mask_email(df[col.name])
            elif global_hash and any(k in col.name.lower() for k in ("secret", "token", "password", "ssn", "hash", "key", "auth", "credential", "card_number", "pin", "salt", "private")):
                df[col.name] = PrivacyEngine.hash_sha256(df[col.name])

        if len(df) > n_rows:
            df = df.iloc[:n_rows].copy()
        assert len(df) == n_rows, f"Exact row count guarantee failed: expected {n_rows}, got {len(df)}"
        return df

    def _generate_base_column(
        self,
        col: ColumnSpec,
        n_rows: int,
        rng: np.random.Generator,
        faker: Faker
    ) -> np.ndarray:
        """Dispatches column generation by ColumnType."""
        col_type = col.type

        # Special semantic column checks
        col_name_lower = col.name.lower()
        if col_name_lower in ("currency", "curr"):
            return np.full(n_rows, self.default_currency, dtype=object)
        if col_name_lower in ("national_id", "cnic", "nid"):
            return LocaleManager.generate_national_id(self.locale, n_rows, rng)

        if col_type == ColumnType.ID:
            return self._generate_id_column(col, n_rows, rng)

        elif col_type == ColumnType.INT:
            return self._generate_int_column(col, n_rows, rng)

        elif col_type == ColumnType.FLOAT:
            return self._generate_float_column(col, n_rows, rng)

        elif col_type == ColumnType.CATEGORY:
            return self._generate_category_column(col, n_rows, rng)

        elif col_type == ColumnType.BOOLEAN:
            return self._generate_boolean_column(col, n_rows, rng)

        elif col_type == ColumnType.DATE:
            return self._generate_date_column(col, n_rows, rng)

        elif col_type == ColumnType.DATETIME:
            return self._generate_datetime_column(col, n_rows, rng)

        elif col_type in (ColumnType.PERSON_NAME, ColumnType.FIRST_NAME, ColumnType.LAST_NAME):
            return self._generate_name_column(col, n_rows, faker, rng)

        elif col_type == ColumnType.EMAIL:
            return self._generate_email_column(col, n_rows, faker, rng)

        elif col_type == ColumnType.PHONE:
            return self._generate_phone_column(col, n_rows, rng)

        elif col_type in (ColumnType.ADDRESS, ColumnType.CITY, ColumnType.STATE, ColumnType.ZIP_CODE, ColumnType.COUNTRY):
            return self._generate_address_column(col, n_rows, faker, rng)

        elif col_type == ColumnType.TEXT_PLACEHOLDER:
            return self._generate_text_column(col, n_rows, faker)

        else:
            # Fallback string
            return np.array([f"item_{i+1}" for i in range(n_rows)], dtype=object)

    def _generate_id_column(self, col: ColumnSpec, n_rows: int, rng: Optional[np.random.Generator] = None) -> np.ndarray:
        if col.name.lower() in ("national_id", "cnic", "nid"):
            if rng is None:
                rng = np.random.default_rng(42)
            return LocaleManager.generate_national_id(self.locale, n_rows, rng)

        prefix = col.prefix or ("ID-" if not col.name.endswith("_id") else "")
        if prefix:
            # Padded sequence: e.g. CUST-00001
            digits = max(5, len(str(n_rows)))
            return np.array([f"{prefix}{str(i+1).zfill(digits)}" for i in range(n_rows)], dtype=object)
        else:
            return np.arange(1, n_rows + 1)

    def _generate_int_column(
        self,
        col: ColumnSpec,
        n_rows: int,
        rng: np.random.Generator
    ) -> np.ndarray:
        low = int(col.min) if col.min is not None else 0
        high = int(col.max) if col.max is not None else 1000

        dist = col.dist or DistributionType.UNIFORM
        params = col.params or {}

        if dist == DistributionType.POISSON:
            lam = float(params.get("lambda", params.get("lam", 5.0)))
            raw = rng.poisson(lam=lam, size=n_rows)
        elif dist == DistributionType.NORMAL:
            loc = float(params.get("mean", (low + high) / 2))
            scale = float(params.get("std", max(1.0, (high - low) / 6)))
            raw = np.round(rng.normal(loc=loc, scale=scale, size=n_rows)).astype(int)
        elif dist == DistributionType.BINOMIAL:
            n_trials = int(params.get("n", 10))
            p = float(params.get("p", 0.5))
            raw = rng.binomial(n=n_trials, p=p, size=n_rows)
        else:
            raw = rng.integers(low=low, high=high + 1, size=n_rows)

        if col.min is not None or col.max is not None:
            min_val = low if col.min is not None else -np.inf
            max_val = high if col.max is not None else np.inf
            raw = np.clip(raw, min_val, max_val).astype(int)

        return raw

    def _generate_float_column(
        self,
        col: ColumnSpec,
        n_rows: int,
        rng: np.random.Generator
    ) -> np.ndarray:
        low = float(col.min) if col.min is not None else 0.0
        high = float(col.max) if col.max is not None else 1000.0

        dist = col.dist or DistributionType.UNIFORM
        params = col.params or {}

        if dist == DistributionType.NORMAL:
            loc = float(params.get("mean", (low + high) / 2))
            scale = float(params.get("std", params.get("sigma", max(1.0, (high - low) / 6))))
            raw = rng.normal(loc=loc, scale=scale, size=n_rows)
        elif dist == DistributionType.LOGNORMAL:
            mean = float(params.get("mean", 10.0))
            sigma = float(params.get("sigma", 0.5))
            raw = rng.lognormal(mean=mean, sigma=sigma, size=n_rows)
        elif dist == DistributionType.EXPONENTIAL:
            scale = float(params.get("scale", 100.0))
            raw = rng.exponential(scale=scale, size=n_rows)
        elif dist == DistributionType.BETA:
            a = float(params.get("a", 2.0))
            b = float(params.get("b", 5.0))
            raw = low + rng.beta(a=a, b=b, size=n_rows) * (high - low)
        elif dist == DistributionType.GAMMA:
            shape = float(params.get("shape", 2.0))
            scale = float(params.get("scale", 2.0))
            raw = rng.gamma(shape=shape, scale=scale, size=n_rows)
        else:
            raw = rng.uniform(low=low, high=high, size=n_rows)

        if col.min is not None or col.max is not None:
            min_bound = low if col.min is not None else -np.inf
            max_bound = high if col.max is not None else np.inf
            raw = np.clip(raw, min_bound, max_bound)

        decimals = col.decimals if col.decimals is not None else 2
        return np.round(raw, decimals)

    def _generate_category_column(
        self,
        col: ColumnSpec,
        n_rows: int,
        rng: np.random.Generator
    ) -> np.ndarray:
        values_spec = col.values
        if not values_spec:
            categories = ["Option A", "Option B", "Option C"]
            probabilities = [1 / 3, 1 / 3, 1 / 3]
        elif isinstance(values_spec, dict):
            categories = list(values_spec.keys())
            weights = np.array(list(values_spec.values()), dtype=float)
            total = weights.sum()
            probabilities = (weights / total).tolist() if total > 0 else None
        elif isinstance(values_spec, list):
            categories = values_spec
            probabilities = None
        else:
            categories = ["default"]
            probabilities = [1.0]

        return rng.choice(categories, size=n_rows, p=probabilities)

    def _generate_boolean_column(
        self,
        col: ColumnSpec,
        n_rows: int,
        rng: np.random.Generator
    ) -> np.ndarray:
        true_prob = float(col.params.get("true_prob", 0.5)) if col.params else 0.5
        return rng.choice([True, False], size=n_rows, p=[true_prob, 1.0 - true_prob])

    def _generate_date_column(
        self,
        col: ColumnSpec,
        n_rows: int,
        rng: np.random.Generator
    ) -> np.ndarray:
        if col.range and len(col.range) == 2:
            start_date = pd.to_datetime(col.range[0])
            end_date = pd.to_datetime(col.range[1])
        else:
            start_date = pd.to_datetime("2022-01-01")
            end_date = pd.to_datetime("2025-01-01")

        start_u = start_date.value // 10**9
        end_u = end_date.value // 10**9
        if start_u >= end_u:
            end_u = start_u + 86400 * 365

        random_seconds = rng.integers(low=start_u, high=end_u, size=n_rows)
        date_series = pd.to_datetime(random_seconds, unit="s").strftime("%Y-%m-%d")
        return date_series.to_numpy()

    def _generate_datetime_column(
        self,
        col: ColumnSpec,
        n_rows: int,
        rng: np.random.Generator
    ) -> np.ndarray:
        if col.range and len(col.range) == 2:
            start_date = pd.to_datetime(col.range[0])
            end_date = pd.to_datetime(col.range[1])
        else:
            start_date = pd.to_datetime("2023-01-01T00:00:00")
            end_date = pd.to_datetime("2025-01-01T00:00:00")

        start_u = start_date.value // 10**9
        end_u = end_date.value // 10**9
        if start_u >= end_u:
            end_u = start_u + 86400 * 365

        random_seconds = rng.integers(low=start_u, high=end_u, size=n_rows)
        dt_series = pd.to_datetime(random_seconds, unit="s").strftime("%Y-%m-%d %H:%M:%S")
        return dt_series.to_numpy()

    def _generate_name_column(
        self,
        col: ColumnSpec,
        n_rows: int,
        faker: Faker,
        rng: Optional[np.random.Generator] = None
    ) -> np.ndarray:
        if rng is None:
            rng = np.random.default_rng(42)
        loc_names = LocaleManager.generate_names(self.locale, n_rows, rng)
        if loc_names is not None:
            if col.type == ColumnType.FIRST_NAME:
                return np.array([name.split()[0] for name in loc_names], dtype=object)
            elif col.type == ColumnType.LAST_NAME:
                return np.array([name.split()[-1] for name in loc_names], dtype=object)
            return loc_names

        if col.type == ColumnType.FIRST_NAME:
            return np.array([faker.first_name() for _ in range(n_rows)], dtype=object)
        elif col.type == ColumnType.LAST_NAME:
            return np.array([faker.last_name() for _ in range(n_rows)], dtype=object)
        else:
            return np.array([faker.name() for _ in range(n_rows)], dtype=object)

    def _generate_email_column(
        self,
        col: ColumnSpec,
        n_rows: int,
        faker: Faker,
        rng: np.random.Generator
    ) -> np.ndarray:
        domain = "example.com"
        emails = []
        seen: Set[str] = set()
        for i in range(n_rows):
            uname = faker.user_name()
            email = f"{uname}@{domain}"
            if col.unique:
                counter = 1
                while email in seen:
                    email = f"{uname}{counter}@{domain}"
                    counter += 1
                seen.add(email)
            emails.append(email)
        return np.array(emails, dtype=object)

    def _generate_phone_column(
        self,
        col: ColumnSpec,
        n_rows: int,
        rng: np.random.Generator
    ) -> np.ndarray:
        return LocaleManager.generate_phone(self.locale, n_rows, rng)

    def _generate_address_column(
        self,
        col: ColumnSpec,
        n_rows: int,
        faker: Faker,
        rng: Optional[np.random.Generator] = None
    ) -> np.ndarray:
        if rng is None:
            rng = np.random.default_rng(42)
        if col.type == ColumnType.CITY:
            loc_cities = LocaleManager.generate_cities(self.locale, n_rows, rng)
            if loc_cities is not None:
                return loc_cities
            return np.array([faker.city() for _ in range(n_rows)], dtype=object)
        elif col.type == ColumnType.STATE:
            return np.array([faker.state_abbr() for _ in range(n_rows)], dtype=object)
        elif col.type == ColumnType.ZIP_CODE:
            return np.array([faker.zipcode() for _ in range(n_rows)], dtype=object)
        elif col.type == ColumnType.COUNTRY:
            if self.locale == "en_PK":
                return np.full(n_rows, "Pakistan", dtype=object)
            elif self.locale == "de_DE":
                return np.full(n_rows, "Germany", dtype=object)
            elif self.locale == "en_GB":
                return np.full(n_rows, "United Kingdom", dtype=object)
            return np.array([faker.country() for _ in range(n_rows)], dtype=object)
        else:
            loc_addr = LocaleManager.generate_addresses(self.locale, n_rows, rng)
            if loc_addr is not None:
                return loc_addr
            return np.array([faker.street_address() for _ in range(n_rows)], dtype=object)

    def _generate_text_column(
        self,
        col: ColumnSpec,
        n_rows: int,
        faker: Faker
    ) -> np.ndarray:
        return np.array([faker.sentence(nb_words=8) for _ in range(n_rows)], dtype=object)

    def _generate_derived_column(
        self,
        col: ColumnSpec,
        df: pd.DataFrame,
        n_rows: int,
        rng: np.random.Generator,
        faker: Faker
    ) -> np.ndarray:
        src_col = col.derive_from
        if not src_col or src_col not in df.columns:
            return self._generate_base_column(col, n_rows, rng, faker)

        src_values = df[src_col].fillna("").astype(str)

        if col.type == ColumnType.EMAIL:
            domain = "example.com"
            emails = []
            seen: Set[str] = set()
            for val in src_values:
                # Slugify full name to email prefix: e.g. "Jane Doe" -> "jane.doe"
                slug = re.sub(r"[^a-zA-Z0-9]+", ".", val.strip().lower()).strip(".")
                if not slug:
                    slug = "user"
                email = f"{slug}@{domain}"
                if col.unique:
                    counter = 1
                    while email in seen:
                        email = f"{slug}.{counter}@{domain}"
                        counter += 1
                    seen.add(email)
                emails.append(email)
            return np.array(emails, dtype=object)

        if col.transform == "lowercase":
            return src_values.str.lower().to_numpy()
        elif col.transform == "uppercase":
            return src_values.str.upper().to_numpy()

        return src_values.to_numpy()

    def generate_domain(self, domain_spec: DomainSpec) -> Dict[str, pd.DataFrame]:
        """Generates all tables for a full DomainSpec deterministically."""
        tables_data: Dict[str, pd.DataFrame] = {}
        for idx, table_spec in enumerate(domain_spec.tables):
            # Derive deterministic table seed based on domain seed and table index
            table_seed = domain_spec.seed + (idx * 1000)
            df = self.generate_table(
                table_spec=table_spec,
                seed=table_seed,
                global_edge_cases=domain_spec.edge_cases
            )
            tables_data[table_spec.name] = df
        return tables_data
