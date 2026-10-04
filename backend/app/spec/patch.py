from typing import Any, Dict, List, Optional
import copy
from backend.app.spec.models import DomainSpec, TableSpec, ColumnSpec


def apply_spec_patch(spec: DomainSpec, patch: Dict[str, Any]) -> DomainSpec:
    """
    Applies JSON-style patch dictionary to an existing DomainSpec without destroying unchanged fields.
    """
    spec_copy = spec.model_copy(deep=True)

    # 1. Top-level scalar overrides
    for key in ("domain", "locale", "currency", "seed", "default_applied", "default_note", "requested_rows"):
        if key in patch:
            setattr(spec_copy, key, patch[key])

    # 2. Constraints / rules
    if "rules" in patch:
        spec_copy.rules = patch["rules"]
    if "edge_cases" in patch:
        for ec_k, ec_v in patch["edge_cases"].items():
            setattr(spec_copy.edge_cases, ec_k, ec_v)

    # 3. Quantities
    if "quantities" in patch:
        q_data = patch["quantities"]
        if "rows" in q_data:
            spec_copy.quantities.rows.update(q_data["rows"])
        if "columns" in q_data:
            spec_copy.quantities.columns.update(q_data["columns"])
        if "documents" in q_data:
            spec_copy.quantities.documents.update(q_data["documents"])

    # 4. Table updates
    if "tables" in patch:
        tables_patch = patch["tables"]
        if isinstance(tables_patch, list):
            # List of table dicts or TableSpec
            for t_patch in tables_patch:
                t_name = t_patch.get("name") if isinstance(t_patch, dict) else t_patch.name
                existing = spec_copy.get_table(t_name)
                if existing:
                    if isinstance(t_patch, dict):
                        if "rows" in t_patch:
                            existing.rows = t_patch["rows"]
                        if "columns" in t_patch:
                            # Update or add columns
                            for c_patch in t_patch["columns"]:
                                c_name = c_patch.get("name")
                                ex_col = next((c for c in existing.columns if c.name == c_name), None)
                                if ex_col:
                                    for ck, cv in c_patch.items():
                                        setattr(ex_col, ck, cv)
                                else:
                                    existing.columns.append(ColumnSpec(**c_patch))
                    else:
                        idx = spec_copy.tables.index(existing)
                        spec_copy.tables[idx] = t_patch
                else:
                    new_t = t_patch if isinstance(t_patch, TableSpec) else TableSpec(**t_patch)
                    spec_copy.tables.append(new_t)
        elif isinstance(tables_patch, dict):
            # Dict mapping table name to patch dict
            for t_name, t_patch in tables_patch.items():
                existing = spec_copy.get_table(t_name)
                if existing:
                    if "rows" in t_patch:
                        existing.rows = t_patch["rows"]
                    if "columns" in t_patch:
                        for c_patch in t_patch["columns"]:
                            c_name = c_patch.get("name")
                            ex_col = next((c for c in existing.columns if c.name == c_name), None)
                            if ex_col:
                                for ck, cv in c_patch.items():
                                    setattr(ex_col, ck, cv)
                            else:
                                existing.columns.append(ColumnSpec(**c_patch))

    # 5. Row patches directly (e.g. {"patch_rows": {"customers": 10000}})
    if "patch_rows" in patch:
        for t_name, rows_count in patch["patch_rows"].items():
            t = spec_copy.get_table(t_name)
            if t:
                t.rows = rows_count
            spec_copy.quantities.rows[t_name] = rows_count

    return spec_copy


class SpecVersionHistory:
    """Version history manager with undo/redo stack for DomainSpecs."""

    def __init__(self, initial_spec: Optional[DomainSpec] = None):
        self._history: List[DomainSpec] = []
        self._redo_stack: List[DomainSpec] = []
        if initial_spec:
            self._history.append(initial_spec.model_copy(deep=True))

    def record_version(self, spec: DomainSpec) -> None:
        """Pushes a new spec version onto the history stack."""
        self._history.append(spec.model_copy(deep=True))
        self._redo_stack.clear()

    def undo(self) -> Optional[DomainSpec]:
        """Reverts to previous spec state."""
        if len(self._history) <= 1:
            return None
        current = self._history.pop()
        self._redo_stack.append(current)
        return self._history[-1].model_copy(deep=True)

    def redo(self) -> Optional[DomainSpec]:
        """Re-applies a previously undone spec state."""
        if not self._redo_stack:
            return None
        restored = self._redo_stack.pop()
        self._history.append(restored)
        return restored.model_copy(deep=True)

    @property
    def current(self) -> Optional[DomainSpec]:
        return self._history[-1].model_copy(deep=True) if self._history else None

    @property
    def can_undo(self) -> bool:
        return len(self._history) > 1

    @property
    def can_redo(self) -> bool:
        return len(self._redo_stack) > 0
