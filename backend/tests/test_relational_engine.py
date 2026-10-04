import numpy as np
import pandas as pd
import pytest

from backend.app.domains.packs import get_domain_pack
from backend.app.engines.relational import RelationalEngine
from backend.app.spec.models import (
    ChildCountSpec,
    ColumnSpec,
    ColumnType,
    DistributionType,
    DomainSpec,
    RelationSpec,
    TableSpec,
)


@pytest.fixture
def relational_fintech_spec() -> DomainSpec:
    return get_domain_pack("fintech")


def test_topological_sort_ordering(relational_fintech_spec):
    """Phase 3 Gate: Tables are generated strictly in topological order."""
    engine = RelationalEngine()
    ordered = engine.topological_sort(relational_fintech_spec)
    order_names = [t.name for t in ordered]

    # customers must precede accounts, accounts must precede transactions
    assert order_names.index("customers") < order_names.index("accounts")
    assert order_names.index("accounts") < order_names.index("transactions")


def test_zero_orphan_fks(relational_fintech_spec):
    """Phase 3 Gate: 0 orphan FKs across all related tables."""
    engine = RelationalEngine()
    dataset = engine.generate_relational(relational_fintech_spec, seed=42)

    customers = dataset["customers"]
    accounts = dataset["accounts"]
    transactions = dataset["transactions"]

    # 1. Accounts FKs must all exist in Customers PKs
    cust_pks = set(customers["customer_id"])
    account_fks = set(accounts["customer_id"])
    orphan_accounts = account_fks - cust_pks
    assert len(orphan_accounts) == 0, f"Found orphan account FKs: {orphan_accounts}"

    # 2. Transactions FKs must all exist in Accounts PKs
    acc_pks = set(accounts["account_id"])
    txn_fks = set(transactions["account_id"])
    orphan_txns = txn_fks - acc_pks
    assert len(orphan_txns) == 0, f"Found orphan transaction FKs: {orphan_txns}"


def test_primary_keys_strictly_unique(relational_fintech_spec):
    """Phase 3 Gate: PK columns are 100% unique in every table."""
    engine = RelationalEngine()
    dataset = engine.generate_relational(relational_fintech_spec, seed=42)

    assert dataset["customers"]["customer_id"].nunique() == len(dataset["customers"])
    assert dataset["accounts"]["account_id"].nunique() == len(dataset["accounts"])
    assert dataset["transactions"]["transaction_id"].nunique() == len(dataset["transactions"])


def test_cross_table_date_ordering(relational_fintech_spec):
    """Phase 3 Gate: Child dates >= parent dates."""
    engine = RelationalEngine()
    dataset = engine.generate_relational(relational_fintech_spec, seed=42)

    customers = dataset["customers"]
    accounts = dataset["accounts"]

    # Merge accounts with customers by FK
    merged = accounts.merge(customers, on="customer_id", suffixes=("_acc", "_cust"))
    acc_opened = pd.to_datetime(merged["opened_date"])
    cust_signup = pd.to_datetime(merged["signup_date"])

    # Non-null account opened_date must be >= customer signup_date
    valid = acc_opened.notna() & cust_signup.notna()
    assert (acc_opened[valid] >= cust_signup[valid]).all()


def test_cardinality_1_to_1():
    """Phase 3 Gate: 1:1 cardinality matches exactly 1 child per parent."""
    spec = DomainSpec(
        domain="one_to_one_test",
        seed=123,
        tables=[
            TableSpec(
                name="users",
                rows=100,
                columns=[
                    ColumnSpec(name="user_id", type=ColumnType.ID, pk=True),
                    ColumnSpec(name="name", type=ColumnType.PERSON_NAME),
                ]
            ),
            TableSpec(
                name="profiles",
                rows=100,
                columns=[
                    ColumnSpec(name="profile_id", type=ColumnType.ID, pk=True),
                    ColumnSpec(name="user_id", type=ColumnType.ID),
                    ColumnSpec(name="bio", type=ColumnType.TEXT_PLACEHOLDER),
                ]
            )
        ],
        relations=[
            RelationSpec(
                parent="users",
                child="profiles",
                fk="user_id",
                cardinality="1:1"
            )
        ]
    )

    engine = RelationalEngine()
    dataset = engine.generate_relational(spec, seed=123)

    assert len(dataset["users"]) == 100
    assert len(dataset["profiles"]) == 100
    # Every user has exactly one profile
    assert set(dataset["profiles"]["user_id"]) == set(dataset["users"]["user_id"])
