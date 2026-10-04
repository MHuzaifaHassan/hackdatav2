import pytest
import asyncio
from backend.app.spec.infer import SpecInferenceEngine

@pytest.mark.asyncio
async def test_bug0c_patients_table():
    prompt = "Generate exactly 500 rows, table patients, exactly 2 columns: customer_id (unique) and disease."
    spec = await SpecInferenceEngine.infer_from_prompt(prompt)
    
    # Assert exact row count
    assert spec.tables[0].rows == 500, f"Expected 500 rows, got {spec.tables[0].rows}"
    
    # Assert exact table name
    assert spec.tables[0].name.lower() == "patients", f"Expected table name patients, got {spec.tables[0].name}"
    
    # Assert exact 2 columns
    assert len(spec.tables[0].columns) == 2, f"Expected 2 columns, got {len(spec.tables[0].columns)}"
    
    # Assert column names
    col_names = [c.name.lower() for c in spec.tables[0].columns]
    assert "customer_id" in col_names, f"Expected customer_id, got {col_names}"
    assert "disease" in col_names, f"Expected disease, got {col_names}"
    
    # Assert unique on customer_id
    customer_id_col = next(c for c in spec.tables[0].columns if c.name.lower() == "customer_id")
    assert customer_id_col.unique is True, "customer_id must be unique"

@pytest.mark.asyncio
async def test_bug0c_xyz_table():
    prompt = "Generate exactly 500 rows, table xyz_records, exactly 2 columns: customer_id (unique) and disease."
    spec = await SpecInferenceEngine.infer_from_prompt(prompt)
    
    assert spec.tables[0].rows == 500
    assert spec.tables[0].name.lower() == "xyz_records"
    assert len(spec.tables[0].columns) == 2
    
    col_names = [c.name.lower() for c in spec.tables[0].columns]
    assert "customer_id" in col_names
    assert "disease" in col_names
