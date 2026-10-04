import json
import asyncio
from typing import Any, Dict
from backend.app.spec.models import DomainSpec
from backend.app.validation.validator import ValidationResult
from backend.app.spec.patch import apply_spec_patch
from backend.app.llm.provider import get_llm_provider

class RefinerAgent:
    @classmethod
    async def refine(cls, spec: DomainSpec, validation_result: ValidationResult) -> DomainSpec:
        """Takes a failed ValidationResult and proposes a spec patch, then applies it."""
        if validation_result.passed:
            return spec

        provider = get_llm_provider()
        
        # Build prompt to fix the issues
        prompt = f"""
        You are an expert synthetic data engineer. The generated data failed validation.
        
        Current Spec:
        {spec.model_dump_json(indent=2)}
        
        Issues:
        {json.dumps(validation_result.issues, indent=2)}
        
        Fix Suggestions from Validator:
        {json.dumps(validation_result.fix_suggestions, indent=2)}
        
        Generate a JSON dict to patch the DomainSpec. The patch must be a dictionary that maps to the DomainSpec fields you want to update.
        Example:
        {{
          "edge_cases": {{"null_rate": 0.05}},
          "patch_rows": {{"customers": 1000}}
        }}
        
        Return ONLY the JSON dict. Do not include markdown formatting or explanations.
        """
        
        try:
            patch_dict = await provider.generate_json(prompt)
            
            if isinstance(patch_dict, dict):
                # Apply patch
                patched_spec = apply_spec_patch(spec, patch_dict)
                return patched_spec
        except Exception as e:
            print(f"Refiner LLM error: {e}")
            
        return spec
