import pytest
from backend.app.spec.infer import SpecInferenceEngine
from backend.app.engines.relational import RelationalEngine
from backend.app.engines.tabular import TabularEngine
from backend.app.engines.text_fill import DOMAIN_VOCABULARIES


@pytest.mark.asyncio
async def test_prompt_table_patients_exact_columns():
    """(a) prompt with table 'patients' gives columns [customer_id, disease] and 500 rows."""
    prompt = (
        "Generate a tabular dataset of exactly 500 rows. Table name: patients. "
        "Exactly 2 columns: customer_id (unique) and disease..."
    )
    spec = await SpecInferenceEngine.infer_from_prompt(prompt)
    
    # Check table name and columns in spec
    assert len(spec.tables) == 1, f"Expected 1 table, got {[t.name for t in spec.tables]}"
    table = spec.tables[0]
    assert table.name == "patients", f"Expected table 'patients', got '{table.name}'"
    col_names = [c.name for c in table.columns]
    assert col_names == ["customer_id", "disease"], f"Expected ['customer_id', 'disease'], got {col_names}"
    assert table.rows == 500

    # Generate data
    engine = RelationalEngine()
    datasets = engine.generate_relational(spec, seed=42)
    assert "patients" in datasets
    df = datasets["patients"]
    
    # (c) Exactly 500 rows
    assert len(df) == 500
    assert list(df.columns) == ["customer_id", "disease"]
    
    # (d) customer_id unique
    assert df["customer_id"].is_unique
    assert df["customer_id"].nunique() == 500
    
    # (e) disease values come from real disease list, never "Disease 1" placeholders
    diseases = df["disease"].tolist()
    assert len(diseases) == 500
    known_diseases = set(DOMAIN_VOCABULARIES["healthcare"]["icd10"])
    for d in diseases:
        assert d != "Disease 1"
        assert not str(d).startswith("disease_val_")
        assert not str(d).startswith("Option ")
        assert d in known_diseases or any(kd in str(d) for kd in ["diabetes", "hypertension", "pain", "asthma", "fatigue", "infection", "disorder", "syndrome", "fever", "cough"])


@pytest.mark.asyncio
async def test_prompt_table_xyz_records_exact_columns():
    """(b) same prompt with table 'xyz_records' gives same columns."""
    prompt = (
        "Generate a tabular dataset of exactly 500 rows. Table name: xyz_records. "
        "Exactly 2 columns: customer_id (unique) and disease..."
    )
    spec = await SpecInferenceEngine.infer_from_prompt(prompt)
    
    assert len(spec.tables) == 1, f"Expected 1 table, got {[t.name for t in spec.tables]}"
    table = spec.tables[0]
    assert table.name == "xyz_records", f"Expected table 'xyz_records', got '{table.name}'"
    col_names = [c.name for c in table.columns]
    assert col_names == ["customer_id", "disease"], f"Expected ['customer_id', 'disease'], got {col_names}"
    assert table.rows == 500

    # Generate data
    engine = RelationalEngine()
    datasets = engine.generate_relational(spec, seed=42)
    assert "xyz_records" in datasets
    df = datasets["xyz_records"]
    
    # (c) Exactly 500 rows
    assert len(df) == 500
    assert list(df.columns) == ["customer_id", "disease"]
    
    # (d) customer_id unique
    assert df["customer_id"].is_unique
    
    # (e) disease values come from real disease list
    diseases = df["disease"].tolist()
    for d in diseases:
        assert d != "Disease 1"
        assert not str(d).startswith("disease_val_")


@pytest.mark.asyncio
async def test_tabular_engine_direct_generation():
    """Verify TabularEngine directly generates the table with uniqueness and disease vocabulary."""
    prompt = (
        "Generate a tabular dataset of exactly 500 rows. Table name: patients. "
        "Exactly 2 columns: customer_id (unique) and disease..."
    )
    spec = await SpecInferenceEngine.infer_from_prompt(prompt)
    engine = TabularEngine()
    df = engine.generate_table(table_spec=spec.tables[0], seed=42, global_edge_cases=spec.edge_cases)
    assert len(df) == 500
    assert list(df.columns) == ["customer_id", "disease"]
    assert df["customer_id"].is_unique
    assert df["customer_id"].nunique() == 500
    diseases = df["disease"].tolist()
    for d in diseases:
        assert d != "Disease 1"
        assert not str(d).startswith("disease_val_")
