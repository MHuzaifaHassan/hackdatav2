from pathlib import Path
from typing import Dict, List, Optional
import yaml

from backend.app.config import settings
from backend.app.spec.models import DomainSpec

_CACHE: Dict[str, DomainSpec] = {}


def get_available_domain_packs() -> List[str]:
    """Returns list of built-in domain pack names."""
    domains_dir = settings.DOMAINS_DIR
    if not domains_dir.exists():
        return ["fintech", "healthcare", "ecommerce", "hr", "logistics"]
    return [p.stem for p in domains_dir.glob("*.yaml")]


def get_domain_pack(name: str) -> DomainSpec:
    """Loads a DomainSpec from the YAML domain packs directory."""
    clean_name = name.lower().strip()
    if clean_name in _CACHE:
        return _CACHE[clean_name].model_copy(deep=True)

    yaml_path = settings.DOMAINS_DIR / f"{clean_name}.yaml"
    if not yaml_path.exists():
        # Fallback to fintech if requested domain pack not found
        yaml_path = settings.DOMAINS_DIR / "fintech.yaml"

    if yaml_path.exists():
        with open(yaml_path, "r", encoding="utf-8") as f:
            raw_data = yaml.safe_load(f)
            spec = DomainSpec(**raw_data)
            _CACHE[clean_name] = spec
            return spec.model_copy(deep=True)

    # Absolute fallback if file doesn't exist
    from backend.app.spec.models import ColumnSpec, ColumnType, TableSpec
    fallback = DomainSpec(
        domain=clean_name,
        tables=[
            TableSpec(
                name="records",
                rows=100,
                columns=[
                    ColumnSpec(name="id", type=ColumnType.ID, pk=True),
                    ColumnSpec(name="name", type=ColumnType.PERSON_NAME),
                    ColumnSpec(name="email", type=ColumnType.EMAIL, derive_from="name"),
                ]
            )
        ]
    )
    _CACHE[clean_name] = fallback
    return fallback
