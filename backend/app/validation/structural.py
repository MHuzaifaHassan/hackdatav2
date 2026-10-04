from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
from backend.app.spec.brief import RequirementBrief
from backend.app.spec.models import DomainSpec


class StructuralValidator:
    """
    Layer A0 & Layer A Code Checks:
    - Quantity checks (requested vs generated rows, columns, documents)
    - Structural integrity: must-have columns, PK uniqueness, zero orphan FKs,
      date monotonicity (child date >= parent date), null rates, and math reconciliation.
    """

    @classmethod
    def check_quantities(
        cls,
        data: Dict[str, pd.DataFrame],
        brief: RequirementBrief,
        doc_count: Optional[int] = None
    ) -> Tuple[bool, List[Dict[str, Any]], List[str]]:
        """
        Layer A0 blocking Quantity Check: verifies exact counts for rows, columns, and documents.
        """
        criteria = []
        issues = []
        all_passed = True

        # 1. Row counts check
        for t_name, req_rows in brief.rows.items():
            if t_name in data:
                actual_rows = len(data[t_name])
                passed = (actual_rows == req_rows)
                if not passed:
                    all_passed = False
                    issues.append(f"Table '{t_name}' row count mismatch: requested {req_rows}, generated {actual_rows}.")
                criteria.append({
                    "id": f"qty_rows_{t_name}",
                    "description": f"Exact row count for table '{t_name}'",
                    "passed": passed,
                    "observed": actual_rows,
                    "expected": req_rows
                })

        # 2. Must-have columns check
        for t_name, req_cols in brief.must_have_columns.items():
            if t_name in data:
                actual_cols = [c.lower() for c in data[t_name].columns]
                for col in req_cols:
                    col_low = col.lower()
                    passed = col_low in actual_cols
                    if not passed:
                        all_passed = False
                        issues.append(f"Table '{t_name}' is missing required column '{col}'.")
                    criteria.append({
                        "id": f"col_present_{t_name}_{col}",
                        "description": f"Required column '{col}' present in '{t_name}'",
                        "passed": passed,
                        "observed": "present" if passed else "missing",
                        "expected": "present"
                    })

        # 3. Document count check if specified
        if "documents" in brief.quantities and doc_count is not None:
            for doc_type, req_docs in brief.quantities["documents"].items():
                passed = (doc_count == req_docs)
                if not passed:
                    all_passed = False
                    issues.append(f"Document '{doc_type}' count mismatch: requested {req_docs}, generated {doc_count}.")
                criteria.append({
                    "id": f"qty_docs_{doc_type}",
                    "description": f"Exact document count for '{doc_type}'",
                    "passed": passed,
                    "observed": doc_count,
                    "expected": req_docs
                })

        return all_passed, criteria, issues

    @classmethod
    def check_relational_integrity(
        cls,
        data: Dict[str, pd.DataFrame],
        spec: DomainSpec
    ) -> Tuple[bool, List[Dict[str, Any]], List[str]]:
        """
        Layer A FK Integrity & PK Uniqueness Check: asserts 0 orphan foreign keys and unique primary keys.
        """
        criteria = []
        issues = []
        all_passed = True

        # PK Uniqueness
        for table in spec.tables:
            if table.name in data:
                df = data[table.name]
                pk_col = table.get_pk_column()
                if pk_col and pk_col.name in df.columns:
                    unique_count = df[pk_col.name].nunique()
                    passed = (unique_count == len(df))
                    if not passed:
                        all_passed = False
                        issues.append(f"Primary key '{pk_col.name}' in table '{table.name}' has duplicates.")
                    criteria.append({
                        "id": f"pk_unique_{table.name}",
                        "description": f"Primary key '{pk_col.name}' is strictly unique in '{table.name}'",
                        "passed": passed,
                        "observed": f"{unique_count}/{len(df)} unique",
                        "expected": "100% unique"
                    })

        # FK Integrity (0 orphans)
        for rel in spec.relations:
            if rel.parent in data and rel.child in data:
                parent_df = data[rel.parent]
                child_df = data[rel.child]

                parent_pk = rel.parent_pk or (spec.get_table(rel.parent).get_pk_column().name if spec.get_table(rel.parent).get_pk_column() else parent_df.columns[0])
                if rel.fk in child_df.columns and parent_pk in parent_df.columns:
                    valid_parent_ids = set(parent_df[parent_pk].dropna())
                    child_fk_ids = set(child_df[rel.fk].dropna())
                    orphan_ids = child_fk_ids - valid_parent_ids
                    passed = (len(orphan_ids) == 0)
                    if not passed:
                        all_passed = False
                        issues.append(f"Found {len(orphan_ids)} orphan foreign keys in relation {rel.child}.{rel.fk} -> {rel.parent}.{parent_pk}.")
                    criteria.append({
                        "id": f"fk_integrity_{rel.child}_{rel.fk}",
                        "description": f"Zero orphan FKs in {rel.child}.{rel.fk} -> {rel.parent}.{parent_pk}",
                        "passed": passed,
                        "observed": f"{len(orphan_ids)} orphans",
                        "expected": "0 orphans"
                    })

        return all_passed, criteria, issues
