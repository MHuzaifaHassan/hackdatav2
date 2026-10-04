import json
import asyncio
import pandas as pd
from typing import Any, Dict, List
from backend.app.spec.brief import RequirementBrief
from backend.app.llm.provider import get_llm_provider


class LLMJudge:
    @classmethod
    def evaluate(cls, brief: RequirementBrief, data: Dict[str, pd.DataFrame]) -> List[Dict[str, Any]]:
        # The LLM judge evaluates custom/qualitative criteria
        # It gets Brief + sample rows + summary stats
        results = []
        custom_criteria = [c for c in brief.success_criteria if c.check_type == "custom_llm"]
        if not custom_criteria:
            return results

        provider = get_llm_provider()
        
        # Prepare context: 20 sample rows from each table
        context = {}
        for table_name, df in data.items():
            sample_df = df.head(20).copy()
            # convert datetimes to string for json serialization
            for col in sample_df.columns:
                if pd.api.types.is_datetime64_any_dtype(sample_df[col]):
                    sample_df[col] = sample_df[col].dt.strftime('%Y-%m-%d %H:%M:%S')
            context[table_name] = sample_df.to_dict(orient="records")

        for criterion in custom_criteria:
            prompt = f"""
            You are an expert data validator evaluating synthetic data.
            Evaluate this specific success criterion:
            ID: {criterion.id}
            Description: {criterion.description}
            
            Data Samples (up to 20 rows per table):
            {json.dumps(context, indent=2, default=str)}
            
            Return ONLY a JSON object with this exact structure:
            {{
                "passed": true or false,
                "reason": "short explanation citing row evidence",
                "observed": "what you saw",
                "expected": "what was required"
            }}
            """
            
            try:
                # Need asyncio run because provider is async
                import nest_asyncio
                nest_asyncio.apply()
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                parsed = loop.run_until_complete(provider.generate_json(prompt))
                
                results.append({
                    "id": criterion.id,
                    "description": criterion.description,
                    "passed": bool(parsed.get("passed", False)),
                    "observed": str(parsed.get("observed", "Error parsing")),
                    "expected": str(parsed.get("expected", criterion.description)),
                    "reason": str(parsed.get("reason", ""))
                })
            except Exception as e:
                results.append({
                    "id": criterion.id,
                    "description": criterion.description,
                    "passed": False,
                    "observed": "LLM Error",
                    "expected": criterion.description,
                    "reason": str(e)
                })

        return results
