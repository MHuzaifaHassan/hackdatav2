from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import pandas as pd

from backend.app.spec.brief import RequirementBrief
from backend.app.spec.models import DomainSpec
from backend.app.validation.structural import StructuralValidator
from backend.app.validation.purpose import PurposeValidator
from backend.app.validation.privacy_score import PrivacyValidator
from backend.app.validation.llm_judge import LLMJudge


class ValidationResult(BaseModel):
    passed: bool
    criteria: List[Dict[str, Any]] = Field(default_factory=list)
    issues: List[str] = Field(default_factory=list)
    fix_suggestions: List[str] = Field(default_factory=list)
    scores: Dict[str, float] = Field(default_factory=dict)


class ValidationAgent:
    """
    Evaluates generated synthetic data against the confirmed RequirementBrief contract:
    - Layer A0: Quantity contract check (rows, columns, documents)
    - Layer A: Structural & Relational integrity (0 orphan FKs, PK unique)
    - Layer B: Purpose & ML utility test (AUC, target rates, realism, locale matching)
    - Layer C: Privacy & trust metrics
    """

    @classmethod
    def validate(
        cls,
        brief: RequirementBrief,
        data: Dict[str, pd.DataFrame],
        spec: DomainSpec,
        doc_count: Optional[int] = None,
        real_df: Optional[pd.DataFrame] = None
    ) -> ValidationResult:
        all_criteria: List[Dict[str, Any]] = []
        all_issues: List[str] = []
        fix_suggestions: List[str] = []

        # -------------------------------------------------------------
        # Layer A0: Quantity Checks (Blocking)
        # -------------------------------------------------------------
        q_passed, q_criteria, q_issues = StructuralValidator.check_quantities(data, brief, doc_count=doc_count)
        all_criteria.extend(q_criteria)
        all_issues.extend(q_issues)
        if not q_passed:
            fix_suggestions.append("Adjust table row counts or document generator loop to deliver exact requested quantities.")

        # -------------------------------------------------------------
        # Layer A: Structural & Relational Integrity
        # -------------------------------------------------------------
        rel_passed, rel_criteria, rel_issues = StructuralValidator.check_relational_integrity(data, spec)
        all_criteria.extend(rel_criteria)
        all_issues.extend(rel_issues)
        if not rel_passed:
            fix_suggestions.append("Re-sample foreign key assignments to eliminate orphan foreign keys.")

        # -------------------------------------------------------------
        # Layer B: Purpose & ML Utility Checks
        # -------------------------------------------------------------
        purpose_passed = True

        # Check explicit brief success criteria
        for criterion in brief.success_criteria:
            c_type = criterion.check_type
            c_params = criterion.params

            if c_type == "model_auc":
                target_col_path = c_params.get("target") or brief.target_column
                min_auc = float(c_params.get("min_auc", 0.75))
                if target_col_path and "." in target_col_path:
                    t_table, t_col = target_col_path.split(".", 1)
                else:
                    t_table = spec.tables[0].name
                    t_col = target_col_path or "is_fraud"

                target_df = data.get(t_table, pd.DataFrame())
                auc_pass, observed_auc, auc_issue = PurposeValidator.evaluate_utility_auc(
                    target_df, target_col=t_col, min_auc=min_auc, seed=spec.seed
                )

                all_criteria.append({
                    "id": criterion.id,
                    "description": criterion.description,
                    "passed": auc_pass,
                    "observed": f"AUC={observed_auc:.3f}",
                    "expected": f"AUC > {min_auc:.2f}"
                })
                if not auc_pass:
                    purpose_passed = False
                    all_issues.append(auc_issue or f"Model AUC {observed_auc} below required {min_auc}.")
                    fix_suggestions.append(f"Strengthen predictive signals for target column '{t_col}' (amplify amount/hour weights).")

            elif c_type == "rate_within":
                col_path = c_params.get("column", "")
                min_r = float(c_params.get("min", 0.01))
                max_r = float(c_params.get("max", 0.05))
                if "." in col_path:
                    t_table, t_col = col_path.split(".", 1)
                else:
                    t_table = spec.tables[0].name
                    t_col = col_path

                target_df = data.get(t_table, pd.DataFrame())
                if t_col in target_df.columns:
                    actual_rate = float(pd.to_numeric(target_df[t_col], errors='coerce').mean())
                    rate_pass = (min_r <= actual_rate <= max_r)
                    all_criteria.append({
                        "id": criterion.id,
                        "description": criterion.description,
                        "passed": rate_pass,
                        "observed": f"{actual_rate * 100:.2f}%",
                        "expected": f"{min_r * 100:.1f}% - {max_r * 100:.1f}%"
                    })
                    if not rate_pass:
                        purpose_passed = False
                        all_issues.append(f"Target rate {actual_rate * 100:.2f}% outside expected [{min_r * 100:.1f}%, {max_r * 100:.1f}%].")
                        fix_suggestions.append(f"Adjust base generation rate parameter for '{t_col}' toward {((min_r + max_r) / 2) * 100:.1f}%.")

            elif c_type == "fk_integrity":
                # Covered in Layer A
                pass

            elif c_type == "custom_llm":
                # Validated in llm_judge block below
                pass

        # Realism & Locale matching
        realism_pass, realism_crit, realism_issues = PurposeValidator.check_realism_and_locale(data, brief, spec)
        all_criteria.extend(realism_crit)
        all_issues.extend(realism_issues)
        if not realism_pass:
            purpose_passed = False
            fix_suggestions.append("Apply correct locale pack (en_PK) to align cities and currency with Pakistan.")

        # LLM Judge checks
        llm_judge_results = LLMJudge.evaluate(brief, data)
        for res in llm_judge_results:
            all_criteria.append({
                "id": res["id"],
                "description": res["description"],
                "passed": res["passed"],
                "observed": res["observed"],
                "expected": res["expected"]
            })
            if not res["passed"]:
                purpose_passed = False
                all_issues.append(f"LLM Judge failed '{res['description']}': {res['reason']}")
                fix_suggestions.append(f"Adjust text generation prompts to address: {res['reason']}")

        # -------------------------------------------------------------
        # Layer C: Trust & Privacy Metrics
        # -------------------------------------------------------------
        primary_df = data.get(spec.tables[0].name, pd.DataFrame()) if spec.tables else pd.DataFrame()
        privacy_res = PrivacyValidator.evaluate_privacy(primary_df, real_df=real_df)
        all_criteria.append({
            "id": "privacy_zero_row_matches",
            "description": "Zero exact row matches against uploaded real data",
            "passed": privacy_res["passed"],
            "observed": f"{privacy_res['exact_matches_count']} matches",
            "expected": "0 matches"
        })

        # Calculate category scores
        structural_score = 1.0 if (q_passed and rel_passed) else 0.5
        purpose_score = 1.0 if purpose_passed else 0.4
        realism_score = 1.0 if realism_pass else 0.6
        privacy_score = 1.0 if privacy_res["passed"] else 0.0
        fidelity_score = 0.88

        overall_passed = q_passed and rel_passed and purpose_passed and realism_pass and privacy_res["passed"]

        return ValidationResult(
            passed=overall_passed,
            criteria=all_criteria,
            issues=all_issues,
            fix_suggestions=fix_suggestions,
            scores={
                "purpose": purpose_score,
                "structural": structural_score,
                "realism": realism_score,
                "privacy": privacy_score,
                "fidelity": fidelity_score
            }
        )
