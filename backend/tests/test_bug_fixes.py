import pytest
from backend.app.spec.infer import SpecInferenceEngine
from backend.app.export.exporter import DataExporter
from backend.app.spec.models import DomainSpec, TableSpec, ColumnSpec

import asyncio

def test_bug_1_user_specified_columns_override():
    prompt = "Generate exactly 500 rows, table patients, exactly 2 columns: customer_id (unique) and disease."
    spec = asyncio.run(SpecInferenceEngine.infer_from_prompt(prompt))
    
    assert len(spec.tables) == 1, f"Expected 1 table, got {len(spec.tables)}"
    t = spec.tables[0]
    assert t.name.lower() == "patients"
    assert t.rows == 500
    
    col_names = [c.name.lower() for c in t.columns]
    assert col_names == ["customer_id", "disease"], f"Expected exactly ['customer_id', 'disease'], got {col_names}"

def test_bug_2_sql_schema_export_current_spec():
    spec = DomainSpec(
        domain="medical",
        tables=[
            TableSpec(
                name="patients",
                rows=500,
                columns=[
                    ColumnSpec(name="customer_id", type="id", pk=True),
                    ColumnSpec(name="disease", type="category")
                ]
            )
        ]
    )
    
    # We will just pass an empty dataframe dict since export_to_sql_dump iterates over it
    import pandas as pd
    sql_script = DataExporter.export_to_sql_dump({"patients": pd.DataFrame(columns=["customer_id", "disease"])}, spec)
    
    # It should not mention retail tables
    assert "retail" not in sql_script.lower(), "SQL schema leaked 'retail' hardcoded schema."
    
    # It should create the patients table
    assert "CREATE TABLE patients" in sql_script, "SQL schema did not create the current table."
    assert "customer_id" in sql_script
    assert "disease" in sql_script

def test_bug_3_erd_single_table():
    spec = DomainSpec(
        domain="medical",
        tables=[
            TableSpec(
                name="patients",
                rows=500,
                columns=[
                    ColumnSpec(name="customer_id", type="id", pk=True),
                    ColumnSpec(name="disease", type="category")
                ]
            )
        ]
    )
    import pandas as pd
    md_content = DataExporter.export_to_schema_markdown(
        {"patients": pd.DataFrame(columns=["customer_id", "disease"])}, 
        spec
    )
    
    # Must contain the short message
    assert "No relationships (single table)" in md_content, "Missing short message for single table."
    
    # Must list columns with PK marker
    assert "PATIENTS {" in md_content, "Missing table box in ERD."
    assert "customer_id PK" in md_content or "PK customer_id" in md_content or "id customer_id PK" in md_content, "Missing PK marker in ERD."
    assert "disease" in md_content, "Missing column in ERD."

