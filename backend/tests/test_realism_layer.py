import numpy as np
import pandas as pd
import pytest
from scipy.stats import pearsonr

from backend.app.domains.packs import get_domain_pack
from backend.app.engines.relational import RelationalEngine
from backend.app.spec.models import (
    ColumnSpec,
    ColumnType,
    DomainSpec,
    RelationSpec,
    TableSpec,
)


def test_no_lorem_ipsum_or_dummy_names():
    """Phase 4 Gate: No 'lorem ipsum' or 'Test User 1' in generated data."""
    fintech_spec = get_domain_pack("fintech")
    engine = RelationalEngine()
    dataset = engine.generate_relational(fintech_spec, seed=42)

    for table_name, df in dataset.items():
        for col in df.columns:
            str_vals = df[col].astype(str).str.lower()
            assert not str_vals.str.contains("lorem ipsum").any(), f"Found lorem ipsum in {table_name}.{col}"
            assert not str_vals.str.contains("test user 1").any(), f"Found dummy user in {table_name}.{col}"


def test_fintech_income_balance_correlation():
    """Phase 4 Gate: Correlation check: income vs balance rho > 0.3."""
    fintech_spec = get_domain_pack("fintech")
    engine = RelationalEngine()
    dataset = engine.generate_relational(fintech_spec, seed=42)

    customers = dataset["customers"]
    accounts = dataset["accounts"]

    merged = accounts.merge(customers, on="customer_id")
    valid = merged["income"].notna() & merged["balance"].notna()
    corr, _ = pearsonr(merged.loc[valid, "income"], merged.loc[valid, "balance"])

    assert corr > 0.30, f"Expected positive correlation > 0.30, got {corr:.3f}"


def test_healthcare_no_impossible_combos():
    """Phase 4 Gate: Healthcare domain has no impossible combinations."""
    health_spec = get_domain_pack("healthcare")
    engine = RelationalEngine()
    dataset = engine.generate_relational(health_spec, seed=42)

    patients = dataset["patients"]
    visits = dataset["visits"]

    # 1. No patient has birth date in future (age >= 0)
    birth_dates = pd.to_datetime(patients["birth_date"]).dropna()
    now = pd.to_datetime("2026-09-29")
    assert (birth_dates <= now).all()

    # 2. Check visits after patient birth
    merged = visits.merge(patients, on="patient_id")
    v_dates = pd.to_datetime(merged["visit_date"])
    b_dates = pd.to_datetime(merged["birth_date"])
    valid = v_dates.notna() & b_dates.notna()
    assert (v_dates[valid] >= b_dates[valid]).all()


def test_realistic_merchants_in_transactions():
    """Phase 4 Gate: Transactions contain authentic merchant names."""
    fintech_spec = get_domain_pack("fintech")
    engine = RelationalEngine()
    dataset = engine.generate_relational(fintech_spec, seed=42)
    txns = dataset["transactions"]

    # Descriptions should contain known brands like Amazon, Starbucks, Uber, etc.
    desc_str = txns["description"].astype(str).str.cat(sep=" ")
    assert any(brand in desc_str for brand in ["Amazon", "Starbucks, Uber, Walmart, Target, Whole Foods, Rent, Payroll".split(", ")])


def test_unicode_accented_international_characters():
    """Verify Unicode & accented international characters are injected when enabled."""
    from backend.app.engines.tabular import TabularEngine
    from backend.app.spec.models import EdgeCasesSpec

    table = TableSpec(
        name="international_users",
        rows=50,
        columns=[
            ColumnSpec(name="user_id", type=ColumnType.ID, pk=True),
            ColumnSpec(name="full_name", type=ColumnType.PERSON_NAME),
        ]
    )
    edge_cases = EdgeCasesSpec(unicode_names=True)
    engine = TabularEngine()
    df = engine.generate_table(table, seed=42, global_edge_cases=edge_cases)

    # Verify at least some names have non-ASCII unicode accented characters
    names = df["full_name"].tolist()
    has_unicode = any(any(ord(char) > 127 for char in name) for name in names)
    assert has_unicode, f"Expected accented international characters in names: {names[:5]}"


def test_privacy_and_redaction_suite_email_mask_and_sha256():
    """Verify email masking (jo***@domain.com) and SHA-256 cryptographic secret hashing."""
    from backend.app.engines.tabular import TabularEngine
    from backend.app.spec.models import EdgeCasesSpec
    import re

    table = TableSpec(
        name="credentials_vault",
        rows=20,
        columns=[
            ColumnSpec(name="user_id", type=ColumnType.ID, pk=True),
            ColumnSpec(name="user_email", type=ColumnType.EMAIL),
            ColumnSpec(name="api_key_secret", type=ColumnType.TEXT_PLACEHOLDER),
            ColumnSpec(name="password_hash", type=ColumnType.TEXT_PLACEHOLDER),
        ]
    )
    edge_cases = EdgeCasesSpec(mask_emails=True, hash_secrets=True)
    engine = TabularEngine()
    df = engine.generate_table(table, seed=42, global_edge_cases=edge_cases)

    # 1. Verify masked emails format e.g. jo***@domain.com
    for email in df["user_email"]:
        assert "@" in email, f"Invalid email: {email}"
        local, domain = email.split("@", 1)
        assert "***" in local, f"Email not masked properly: {email}"

    # 2. Verify SHA-256 hashes (64-char hexadecimal strings)
    sha256_pattern = re.compile(r"^[0-9a-f]{64}$")
    for secret in df["api_key_secret"]:
        assert sha256_pattern.match(str(secret)), f"Secret not SHA-256 hashed: {secret}"
    for pwd in df["password_hash"]:
        assert sha256_pattern.match(str(pwd)), f"Password not SHA-256 hashed: {pwd}"
