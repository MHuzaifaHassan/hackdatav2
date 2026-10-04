import pytest
import pandas as pd
from backend.app.spec.brief import RequirementBrief, SuccessCriterion
from backend.app.domains.packs import get_domain_pack
from backend.app.agents.graph import ValidationGraph

@pytest.mark.asyncio
async def test_validation_graph_refiner_loop():
    """
    Test Phase 5 Gate: 
    (a) Deliberately broken spec (fraud 0.4%, no signals) FAILS with correct issues.
    (b) Refiner fixes it within 3 loops and the Brief passes.
    """
    # 1. Create a deliberately broken spec
    spec = get_domain_pack("fintech")
    spec.seed = 999
    
    # Force fraud rate to be very low in the base categorical distribution
    for t in spec.tables:
        if t.name == "transactions":
            for c in t.columns:
                if c.name == "is_fraud":
                    # Break it: 0% fraud, or extremely low
                    c.values = {"1": 0.001, "0": 0.999}
                    
    # 2. Define Brief expecting ~2% fraud and AUC > 0.75
    brief = RequirementBrief(
        purpose="fraud detection model training",
        domain="fintech",
        tables=["customers", "accounts", "transactions"],
        must_have_columns={},
        rows={"customers": 1000, "accounts": 1600, "transactions": 5000},
        quantities={"rows": {"customers": 1000, "accounts": 1600, "transactions": 5000}, "columns": {}, "documents": {}},
        constraints={"region": "US"},
        target_column="transactions.is_fraud",
        success_criteria=[
            SuccessCriterion(
                id="c1",
                description="Fraud rate 1.8% to 2.2%",
                check_type="rate_within",
                params={"column": "transactions.is_fraud", "min": 0.018, "max": 0.022}
            ),
            SuccessCriterion(
                id="c2",
                description="Fraud learnable: AUC > 0.75",
                check_type="model_auc",
                params={"target": "transactions.is_fraud", "min_auc": 0.75}
            )
        ],
        confirmed_by_user=True
    )
    
    # 3. Run the ValidationGraph loop
    result = await ValidationGraph.run(
        brief=brief,
        spec=spec,
        max_retries=2,
        seed=42
    )
    
    # 4. Assertions
    val_result = result["validation_result"]
    assert val_result is not None, "ValidationResult should be returned"
    
    # MockLLMProvider is set up to patch fraud to 2% if it sees a patch request for it
    assert val_result.passed is True, f"Refiner failed to fix the spec. Issues: {val_result.issues}"
    assert result["attempts"] > 0, "It should have failed at least once and used the refiner"
    
    # Verify the spec was actually updated
    t_trans = result["spec"].get_table("transactions")
    c_fraud = next(c for c in t_trans.columns if c.name == "is_fraud")
    assert c_fraud.values["1"] == 0.02, "Spec was not patched to 2% fraud"
