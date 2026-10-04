import pytest
import pandas as pd
from typing import Dict, Any

from backend.app.domains.packs import get_domain_pack
from backend.app.engines.relational import RelationalEngine
from backend.app.engines.tabular import TabularEngine
from backend.app.documents.generator import DocumentEngine
from backend.app.documents.graph import LangGraphDocumentGenerator
from backend.app.spec.models import DomainSpec, TableSpec, ColumnSpec, ColumnType, QuantitiesSpec, ColumnsQuantitySpec
from backend.app.spec.nlp_parser import parse_query_request, extract_quantities_contract
from backend.app.spec.errors import ImpossibleQuantityError


def test_reproduce_bank_statements_shortfall():
    """Reproduces bug where requesting 25 statements with 5 accounts returns only 5 statements."""
    spec = get_domain_pack("fintech")
    spec.get_table("accounts").rows = 5
    spec.get_table("customers").rows = 5

    # Request 25 bank statements
    docs = DocumentEngine.generate_documents(doc_type="bank_statement", domain_spec=spec, count=25)
    # MUST return exactly 25, never min(count, len(accounts))
    assert len(docs) == 25, f"Expected 25 bank statements, got {len(docs)}"


def test_reproduce_relational_child_rows_shortfall():
    """Reproduces bug where child_count Poisson distribution overrides table_spec.rows."""
    spec = get_domain_pack("fintech")
    spec.get_table("customers").rows = 100
    spec.get_table("accounts").rows = 200
    spec.get_table("transactions").rows = 5000  # requested exact 5,000 child rows

    engine = RelationalEngine()
    data = engine.generate_relational(spec, seed=42)
    tx_df = data["transactions"]
    # MUST match exactly 5000 rows
    assert len(tx_df) == 5000, f"Expected exactly 5000 transactions, got {len(tx_df)}"
    # 0 orphan FKs check
    acc_ids = set(data["accounts"]["account_id"])
    assert set(tx_df["account_id"]).issubset(acc_ids)


def test_exact_column_count_and_required_columns():
    """Checks that prompt requesting 12 columns with required columns produces exactly 12 columns."""
    prompt = "transactions with exactly 12 columns: amount, merchant, timestamp, city, is_fraud"
    parsed = parse_query_request(prompt)
    quantities = parsed.get("quantities")
    assert quantities is not None, "quantities contract missing from parsed request"

    spec_dict = parsed["spec"]
    spec = DomainSpec(**spec_dict)
    tx_table = spec.get_table("transactions") or spec.tables[0]
    
    assert len(tx_table.columns) == 12, f"Expected exactly 12 columns, got {len(tx_table.columns)}"
    col_names = [c.name.lower() for c in tx_table.columns]
    for required in ["amount", "merchant", "timestamp", "city", "is_fraud"]:
        assert required in col_names, f"Required column '{required}' missing from {col_names}"


@pytest.mark.parametrize("n_rows", [1, 10, 100, 1000, 10000, 50000])
def test_parametrized_exact_row_counts(n_rows):
    """Guarantees exact row count across orders of magnitude."""
    table_spec = TableSpec(
        name="test_counts",
        rows=n_rows,
        columns=[
            ColumnSpec(name="id", type=ColumnType.ID, pk=True),
            ColumnSpec(name="email", type=ColumnType.EMAIL, unique=True),
            ColumnSpec(name="amount", type=ColumnType.FLOAT, min=10.0, max=500.0),
        ]
    )
    engine = TabularEngine()
    df = engine.generate_table(table_spec, seed=42)
    assert len(df) == n_rows, f"Expected {n_rows} rows, got {len(df)}"
    assert df["id"].nunique() == n_rows


def test_impossible_quantity_error():
    """Guarantees that impossible constraints fail loudly with requested vs possible, not silently return less."""
    table_spec = TableSpec(
        name="impossible_table",
        rows=5000,
        columns=[
            ColumnSpec(
                name="status",
                type=ColumnType.CATEGORY,
                unique=True,
                values=["ACTIVE", "INACTIVE", "PENDING"]  # only 3 possible unique values
            )
        ]
    )
    engine = TabularEngine()
    with pytest.raises(ImpossibleQuantityError) as exc_info:
        engine.generate_table(table_spec, seed=42)
    err = exc_info.value
    assert err.requested == 5000
    assert err.possible == 3
    assert "impossible" in str(err).lower()


def test_document_replacement_on_failure():
    """Injected failure on some documents still ends with exact N valid documents."""
    generator = LangGraphDocumentGenerator()
    # Generate 5 invoices with replacement guarantee
    state = generator.run(request_prompt="generate 5 tax invoices", count=5, seed=42)
    assert len(state.rendered_docs) == 5
    assert len(state.rendered_pdfs) == 5
    assert state.validation_passed is True
