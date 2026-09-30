import numpy as np
import pandas as pd
import pytest

from backend.app.engines.privacy import PrivacyEngine
from backend.app.engines.tabular import TabularEngine
from backend.app.spec.models import (
    ColumnSpec,
    ColumnType,
    DistributionType,
    DomainSpec,
    PrivacyAction,
    PrivacySpec,
    TableSpec,
)


@pytest.fixture
def sample_table_spec() -> TableSpec:
    return TableSpec(
        name="customers",
        rows=1000,
        columns=[
            ColumnSpec(name="customer_id", type=ColumnType.ID, pk=True, prefix="CUST-"),
            ColumnSpec(name="full_name", type=ColumnType.PERSON_NAME),
            ColumnSpec(name="email", type=ColumnType.EMAIL, derive_from="full_name", unique=True),
            ColumnSpec(name="phone", type=ColumnType.PHONE),
            ColumnSpec(name="signup_date", type=ColumnType.DATE, range=["2022-01-01", "2025-08-01"]),
            ColumnSpec(
                name="segment",
                type=ColumnType.CATEGORY,
                values={"retail": 0.70, "premium": 0.25, "business": 0.05}
            ),
            ColumnSpec(
                name="income",
                type=ColumnType.FLOAT,
                dist=DistributionType.LOGNORMAL,
                params={"mean": 10.5, "sigma": 0.5},
                min=15000.0,
                max=500000.0,
                null_rate=0.05
            )
        ]
    )


def test_seed_determinism(sample_table_spec):
    """Gate Check 1: Same seed => bitwise identical output."""
    engine = TabularEngine()
    df1 = engine.generate_table(sample_table_spec, seed=42)
    df2 = engine.generate_table(sample_table_spec, seed=42)
    pd.testing.assert_frame_equal(df1, df2)


def test_different_seed_different_output(sample_table_spec):
    engine = TabularEngine()
    df1 = engine.generate_table(sample_table_spec, seed=42)
    df2 = engine.generate_table(sample_table_spec, seed=999)
    assert not df1["full_name"].equals(df2["full_name"])


def test_exact_row_count(sample_table_spec):
    """Gate Check 2: Row count exact across multiple sizes."""
    engine = TabularEngine()
    for count in [50, 237, 1000]:
        sample_table_spec.rows = count
        df = engine.generate_table(sample_table_spec, seed=42)
        assert len(df) == count


def test_null_rate_within_tolerance():
    """Gate Check 3: Null rate within ±1% for large sample."""
    table = TableSpec(
        name="null_test",
        rows=5000,
        columns=[
            ColumnSpec(name="id", type=ColumnType.ID, pk=True),
            ColumnSpec(name="val", type=ColumnType.INT, min=10, max=100, null_rate=0.10)
        ]
    )
    engine = TabularEngine()
    df = engine.generate_table(table, seed=123)
    null_rate = df["val"].isna().mean()
    # Tolerance ±1% (0.01)
    assert abs(null_rate - 0.10) <= 0.01


def test_category_proportions_within_tolerance():
    """Gate Check 4: Category proportions within ±3%."""
    table = TableSpec(
        name="cat_test",
        rows=5000,
        columns=[
            ColumnSpec(name="id", type=ColumnType.ID, pk=True),
            ColumnSpec(
                name="segment",
                type=ColumnType.CATEGORY,
                values={"retail": 0.70, "premium": 0.25, "business": 0.05}
            )
        ]
    )
    engine = TabularEngine()
    df = engine.generate_table(table, seed=42)
    proportions = df["segment"].value_counts(normalize=True).to_dict()

    assert abs(proportions.get("retail", 0.0) - 0.70) <= 0.03
    assert abs(proportions.get("premium", 0.0) - 0.25) <= 0.03
    assert abs(proportions.get("business", 0.0) - 0.05) <= 0.03


def test_dates_strictly_in_range(sample_table_spec):
    """Gate Check 5: Dates strictly in configured range."""
    sample_table_spec.rows = 500
    engine = TabularEngine()
    df = engine.generate_table(sample_table_spec, seed=42)
    dates = pd.to_datetime(df["signup_date"])
    start = pd.to_datetime("2022-01-01")
    end = pd.to_datetime("2025-08-01")

    assert (dates >= start).all()
    assert (dates <= end).all()


def test_emails_unique_and_derived():
    """Gate Check 6: Emails unique and derived from name when configured."""
    table = TableSpec(
        name="users",
        rows=500,
        columns=[
            ColumnSpec(name="id", type=ColumnType.ID, pk=True),
            ColumnSpec(name="full_name", type=ColumnType.PERSON_NAME),
            ColumnSpec(name="email", type=ColumnType.EMAIL, derive_from="full_name", unique=True)
        ]
    )
    engine = TabularEngine()
    df = engine.generate_table(table, seed=42)
    assert df["email"].nunique() == len(df)
    assert df["email"].str.endswith("@example.com").all()


def test_privacy_masking_and_hashing():
    """Privacy feature checks: masking and hashing."""
    table = TableSpec(
        name="privacy_test",
        rows=100,
        columns=[
            ColumnSpec(name="id", type=ColumnType.ID, pk=True),
            ColumnSpec(
                name="email",
                type=ColumnType.EMAIL,
                privacy=PrivacySpec(action=PrivacyAction.MASK, mask_char="*")
            ),
            ColumnSpec(
                name="secret_code",
                type=ColumnType.TEXT_PLACEHOLDER,
                privacy=PrivacySpec(action=PrivacyAction.HASH, hash_algorithm="sha256")
            )
        ]
    )
    engine = TabularEngine()
    df = engine.generate_table(table, seed=42)

    # Check masking: contains '*' and ends with '@example.com'
    assert df["email"].str.contains(r"\*").all()
    assert df["email"].str.endswith("@example.com").all()

    # Check hashing: SHA256 hex length is 64 characters
    assert (df["secret_code"].str.len() == 64).all()
