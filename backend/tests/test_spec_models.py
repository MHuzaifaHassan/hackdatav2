import json
import pytest
from pydantic import ValidationError
from backend.app.spec.models import (
    ColumnSpec,
    ColumnType,
    DistributionType,
    DomainSpec,
    PrivacyAction,
    PrivacySpec,
    TableSpec,
)


def test_domain_spec_creation_and_serialization():
    spec = DomainSpec(
        domain="fintech",
        locale="en_US",
        currency="USD",
        seed=42,
        tables=[
            TableSpec(
                name="customers",
                rows=500,
                columns=[
                    ColumnSpec(name="customer_id", type=ColumnType.ID, pk=True),
                    ColumnSpec(name="full_name", type=ColumnType.PERSON_NAME),
                    ColumnSpec(name="email", type=ColumnType.EMAIL, derive_from="full_name", unique=True),
                    ColumnSpec(
                        name="segment",
                        type=ColumnType.CATEGORY,
                        values={"retail": 0.7, "premium": 0.25, "business": 0.05}
                    ),
                    ColumnSpec(
                        name="income",
                        type=ColumnType.FLOAT,
                        dist=DistributionType.LOGNORMAL,
                        params={"mean": 10.5, "sigma": 0.5},
                        null_rate=0.02
                    )
                ]
            )
        ]
    )

    # Test serialization to dict and JSON
    spec_dict = spec.model_dump()
    assert spec_dict["domain"] == "fintech"
    assert len(spec_dict["tables"]) == 1
    assert spec_dict["tables"][0]["rows"] == 500

    json_str = spec.model_dump_json()
    reconstructed = DomainSpec.model_validate_json(json_str)
    assert reconstructed.domain == "fintech"
    assert reconstructed.tables[0].columns[0].pk is True


def test_privacy_spec_validation():
    spec = PrivacySpec(
        action=PrivacyAction.MASK,
        mask_char="*",
        unmasked_prefix=3,
        unmasked_suffix=2
    )
    assert spec.action == PrivacyAction.MASK
    assert spec.mask_char == "*"


def test_table_spec_empty_columns_fails():
    with pytest.raises(ValidationError):
        TableSpec(name="empty_table", rows=10, columns=[])


def test_domain_spec_duplicate_tables_fails():
    with pytest.raises(ValidationError):
        DomainSpec(
            tables=[
                TableSpec(name="t1", rows=10, columns=[ColumnSpec(name="id", type=ColumnType.ID, pk=True)]),
                TableSpec(name="t1", rows=20, columns=[ColumnSpec(name="id", type=ColumnType.ID, pk=True)]),
            ]
        )
