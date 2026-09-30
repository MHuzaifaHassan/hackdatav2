import pandas as pd
import pytest

from backend.app.engines.tabular import TabularEngine
from backend.app.llm.provider import MockLLMProvider
from backend.app.spec.infer import SpecInferenceEngine
from backend.app.spec.models import DomainSpec


@pytest.mark.asyncio
async def test_infer_5_domains_and_generate():
    """Phase 2 Gate: 5 domain prompts yield valid DomainSpec and generate data."""
    prompts = [
        "fintech app with customers, accounts, transactions, 100 rows",
        "hospital clinic with patients, visits, and lab reports",
        "ecommerce store with users, products, and orders",
        "company hr system with employees and monthly payroll records",
        "logistics network with warehouses and freight shipments"
    ]

    engine = TabularEngine()
    mock_llm = MockLLMProvider()

    for prompt in prompts:
        spec = await SpecInferenceEngine.infer_from_prompt(prompt, llm=mock_llm)
        assert isinstance(spec, DomainSpec)
        assert len(spec.tables) >= 1

        # Generate data for all tables in this domain to ensure no runtime errors
        tables_data = engine.generate_domain(spec)
        assert len(tables_data) == len(spec.tables)
        for t_name, df in tables_data.items():
            assert isinstance(df, pd.DataFrame)
            assert len(df) > 0


def test_infer_from_csv_sample():
    """Phase 2: CSV sample data profiling and type inference."""
    # Create sample DataFrame
    df = pd.DataFrame({
        "customer_id": [1, 2, 3, 4, 5],
        "full_name": ["Alice Smith", "Bob Jones", "Charlie Brown", "Diana Prince", "Evan Wright"],
        "email": ["alice@example.com", "bob@example.com", "charlie@example.com", "diana@example.com", "evan@example.com"],
        "age": [25, 34, 45, 29, 52],
        "signup_date": ["2023-01-15", "2023-02-20", "2023-03-10", "2023-04-05", "2023-05-12"],
        "is_active": [True, True, False, True, False],
        "score": [88.5, 92.0, 79.5, 95.0, 84.0],
        "tier": ["gold", "silver", "gold", "platinum", "silver"]
    })

    spec = SpecInferenceEngine.infer_from_csv(df, table_name="customers")
    assert spec.domain == "custom_domain"
    assert len(spec.tables) == 1
    table = spec.tables[0]
    assert table.name == "customers"
    assert table.rows == 5

    col_map = {c.name: c for c in table.columns}
    assert col_map["customer_id"].pk is True
    assert col_map["full_name"].type.value in ("person_name", "text-placeholder")
    assert col_map["email"].type.value == "email"
    assert col_map["is_active"].type.value == "boolean"
    assert col_map["signup_date"].type.value == "date"
    assert col_map["tier"].type.value == "category"

    # Now verify we can generate new synthetic data from this inferred CSV spec!
    engine = TabularEngine()
    synth_df = engine.generate_table(table, seed=42)
    assert len(synth_df) == 5
    assert "email" in synth_df.columns
    assert "customer_id" in synth_df.columns


@pytest.mark.asyncio
async def test_repair_loop_fallback():
    """Tests that bad LLM output triggers repair loop and falls back gracefully to pack."""
    class BrokenLLM(MockLLMProvider):
        async def generate_json(self, prompt: str, system_prompt=None):
            # Returns invalid schema missing required tables
            return {"domain": "broken", "invalid_field": 123}

    spec = await SpecInferenceEngine.infer_from_prompt("fintech system", llm=BrokenLLM(), max_repairs=1)
    assert isinstance(spec, DomainSpec)
    assert len(spec.tables) >= 1
    assert spec.domain == "fintech"
