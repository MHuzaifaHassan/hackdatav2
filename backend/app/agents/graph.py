from typing import Any, Dict, Optional
from backend.app.spec.brief import RequirementBrief
from backend.app.spec.models import DomainSpec
from backend.app.engines.relational import RelationalEngine
from backend.app.engines.tabular import TabularEngine
from backend.app.validation.validator import ValidationAgent, ValidationResult
from backend.app.agents.refiner import RefinerAgent

class ValidationGraph:
    """Orchestrates generation -> validation -> refinement loop (max 3 times)."""
    
    @classmethod
    async def run(
        cls,
        brief: RequirementBrief,
        spec: DomainSpec,
        doc_count: Optional[int] = None,
        max_retries: int = 3,
        seed: int = 42
    ) -> Dict[str, Any]:
        """
        Runs the full refinement loop.
        Returns the final generated data, final spec, and final ValidationResult.
        """
        current_spec = spec
        attempt = 0
        final_data = {}
        final_val_result = None

        while attempt <= max_retries:
            attempt_seed = seed + attempt
            
            # Generate Relational Data
            engine = RelationalEngine()
            try:
                data = engine.generate_relational(current_spec, seed=attempt_seed)
            except Exception as e:
                # If there's a generation error, we might just fail out, or treat it as validation failure
                # Let's wrap it in a mock ValidationResult for the refiner
                final_val_result = ValidationResult(
                    passed=False,
                    issues=[f"Engine Error: {str(e)}"],
                    fix_suggestions=["Check impossible quantities or unique constraints."],
                    scores={"purpose":0.0, "structural":0.0, "realism":0.0, "privacy":0.0, "fidelity":0.0}
                )
                final_data = {}
                data = {}

            if data:
                # Validate
                val_result = ValidationAgent.validate(
                    brief=brief,
                    data=data,
                    spec=current_spec,
                    doc_count=doc_count
                )
                final_val_result = val_result
                final_data = data
                
                if val_result.passed:
                    break

            # If we reached here, validation failed. Refine if we have attempts left.
            if attempt < max_retries:
                current_spec = await RefinerAgent.refine(current_spec, final_val_result)
            
            attempt += 1

        return {
            "data": final_data,
            "spec": current_spec,
            "validation_result": final_val_result,
            "attempts": attempt
        }
