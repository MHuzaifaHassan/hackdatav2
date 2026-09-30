import pytest
import pandas as pd
from backend.app.spec.infer import SpecInferenceEngine
from backend.app.spec.nlp_parser import extract_query_size, scale_domain_spec_to_query
from backend.app.engines.relational import RelationalEngine
from backend.app.export.exporter import DataExporter
from backend.app.validation.reconcile import InvariantReconciler


@pytest.mark.asyncio
async def test_acceptance_1_hr_default_100():
    """1. 'generate relation of hr' -> default 100 parent rows, 3+ tables, total = sum of tables."""
    prompt = "generate relation of hr"
    spec = await SpecInferenceEngine.infer_from_prompt(prompt)

    assert spec.domain == "hr"
    assert spec.default_applied is True
    assert spec.default_note == "No size specified, using default: 100 rows."
    assert len(spec.tables) >= 3

    # Generate relational data
    rel_engine = RelationalEngine()
    dataset = rel_engine.generate_relational(spec, seed=42)

    assert len(dataset) >= 3
    # Check parent table employees has exactly 100 rows
    assert len(dataset["employees"]) == 100
    # Check child tables scale with visible ratios
    assert len(dataset["salaries"]) == 100  # 1:1
    assert len(dataset["attendance"]) == 300  # 3.0x
    assert len(dataset["leave_requests"]) == 50  # 0.5x
    assert len(dataset["departments"]) == 10

    # Total equals sum of all tables
    total_rows = sum(len(df) for df in dataset.values())
    expected_sum = 10 + 100 + 100 + 300 + 50
    assert total_rows == expected_sum

    # Integrity check: 0 orphan foreign keys
    fk_audit = InvariantReconciler.check_fk_integrity(dataset, spec)
    assert fk_audit["passed"] is True
    assert fk_audit["total_orphan_records"] == 0


@pytest.mark.asyncio
async def test_acceptance_2_3_4_customers_orders_scaling():
    """2, 3, 4. 'generate 10 / 100 / 500 customers with orders' -> exact parent rows and proportional scaling."""
    rel_engine = RelationalEngine()

    for target_count in [10, 100, 500]:
        prompt = f"generate {target_count} customers with orders"
        spec = await SpecInferenceEngine.infer_from_prompt(prompt)

        assert spec.domain == "ecommerce"
        assert spec.default_applied is False
        assert spec.requested_rows == target_count

        dataset = rel_engine.generate_relational(spec, seed=42)

        # Parent table customers must have EXACTLY target_count rows
        assert len(dataset["customers"]) == target_count
        # Child table orders has 2.0x ratio
        assert len(dataset["orders"]) == target_count * 2
        # Grandchild table order_items has 2.0x ratio to orders
        assert len(dataset["order_items"]) == target_count * 4

        # Total equals sum of tables
        total_rows = sum(len(df) for df in dataset.values())
        assert total_rows == sum(len(df) for df in dataset.values())

        # FK check: 0 orphans
        fk_audit = InvariantReconciler.check_fk_integrity(dataset, spec)
        assert fk_audit["passed"] is True
        assert fk_audit["total_orphan_records"] == 0

        # Unique check: email uniqueness
        emails = dataset["customers"]["email"].dropna()
        assert len(emails) == len(set(emails))


@pytest.mark.asyncio
async def test_acceptance_5_hr_500_employees():
    """5. 'generate hr data with 500 employees' -> employees has exactly 500 rows, child tables scale."""
    prompt = "generate hr data with 500 employees"
    spec = await SpecInferenceEngine.infer_from_prompt(prompt)

    assert spec.domain == "hr"
    assert spec.default_applied is False
    assert spec.requested_rows == 500

    rel_engine = RelationalEngine()
    dataset = rel_engine.generate_relational(spec, seed=42)

    assert len(dataset["employees"]) == 500
    assert len(dataset["salaries"]) == 500
    assert len(dataset["attendance"]) == 1500
    assert len(dataset["leave_requests"]) == 250
    assert len(dataset["departments"]) == 10

    total_rows = sum(len(df) for df in dataset.values())
    expected_sum = 10 + 500 + 500 + 1500 + 250
    assert total_rows == expected_sum

    fk_audit = InvariantReconciler.check_fk_integrity(dataset, spec)
    assert fk_audit["passed"] is True
    assert fk_audit["total_orphan_records"] == 0


def test_acceptance_schema_and_export_integrity():
    """6, 7, 8. Exported files are non-empty, contain exact tables/rows, and schemas match."""
    from backend.app.domains.packs import get_domain_pack
    spec = get_domain_pack("hr")
    spec.get_table("employees").rows = 100
    spec.get_table("salaries").rows = 100
    spec.get_table("attendance").rows = 300
    spec.get_table("leave_requests").rows = 50
    spec.get_table("departments").rows = 10

    rel_engine = RelationalEngine()
    dataset = rel_engine.generate_relational(spec, seed=42)

    # 1. Zip export
    zip_bytes = DataExporter.export_to_csv_zip(dataset)
    assert len(zip_bytes) > 0

    # 2. SQL schema export with FKs, PKs, NOT NULL
    sql_text = DataExporter.export_to_sql_dump(dataset, domain_spec=spec)
    assert "CREATE TABLE employees" in sql_text
    assert "PRIMARY KEY NOT NULL" in sql_text
    assert "FOREIGN KEY (employee_id) REFERENCES employees" in sql_text
    assert "INSERT INTO employees" in sql_text

    # 3. Markdown Schema Documentation
    md_text = DataExporter.export_to_schema_markdown(dataset, domain_spec=spec)
    assert "# Relational Schema Documentation" in md_text
    assert "erDiagram" in md_text
    assert "EMPLOYEES" in md_text
    assert "DEPARTMENTS" in md_text
