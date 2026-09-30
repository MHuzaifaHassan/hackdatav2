from typing import Any, Dict, List
import numpy as np
import pandas as pd
from scipy.stats import pearsonr

from backend.app.spec.models import DomainSpec


class InvariantReconciler:
    """Performs rigorous post-generation reconciliation of mathematical invariants and relational integrity."""

    @classmethod
    def check_fk_integrity(cls, tables_data: Dict[str, pd.DataFrame], domain_spec: DomainSpec) -> Dict[str, Any]:
        """Checks that 0 orphan foreign keys exist across all relationships."""
        results = []
        all_clean = True

        for rel in domain_spec.relations:
            parent_df = tables_data.get(rel.parent)
            child_df = tables_data.get(rel.child)

            if parent_df is None or child_df is None:
                continue

            parent_table = domain_spec.get_table(rel.parent)
            parent_pk = rel.parent_pk or (parent_table.get_pk_column().name if parent_table and parent_table.get_pk_column() else parent_df.columns[0])
            fk_col = rel.fk

            if fk_col in child_df.columns and parent_pk in parent_df.columns:
                parent_pks = set(parent_df[parent_pk].dropna())
                child_fks = set(child_df[fk_col].dropna())
                orphans = child_fks - parent_pks

                passed = len(orphans) == 0
                if not passed:
                    all_clean = False

                results.append({
                    "relation": f"{rel.parent} -> {rel.child}",
                    "foreign_key": fk_col,
                    "orphan_count": len(orphans),
                    "passed": passed
                })

        return {
            "passed": all_clean,
            "checks": results,
            "total_orphan_records": sum(r["orphan_count"] for r in results)
        }

    @classmethod
    def check_date_ordering(cls, tables_data: Dict[str, pd.DataFrame], domain_spec: DomainSpec) -> Dict[str, Any]:
        """Validates that child dates are consistently >= parent dates."""
        checks = []
        all_passed = True

        for rel in domain_spec.relations:
            parent_df = tables_data.get(rel.parent)
            child_df = tables_data.get(rel.child)
            if parent_df is None or child_df is None:
                continue

            parent_table = domain_spec.get_table(rel.parent)
            child_table = domain_spec.get_table(rel.child)
            if not parent_table or not child_table:
                continue

            parent_pk = rel.parent_pk or (parent_table.get_pk_column().name if parent_table.get_pk_column() else parent_df.columns[0])
            fk_col = rel.fk

            p_date_cols = [c.name for c in parent_table.columns if "date" in c.name.lower()]
            c_date_cols = [c.name for c in child_table.columns if "date" in c.name.lower()]

            if p_date_cols and c_date_cols and fk_col in child_df.columns:
                p_col = p_date_cols[0]
                c_col = c_date_cols[0]

                merged = child_df.merge(parent_df, left_on=fk_col, right_on=parent_pk, suffixes=("_child", "_parent"))
                p_dates = pd.to_datetime(merged[f"{p_col}_parent"] if f"{p_col}_parent" in merged.columns else merged[p_col])
                c_dates = pd.to_datetime(merged[f"{c_col}_child"] if f"{c_col}_child" in merged.columns else merged[c_col])

                valid = p_dates.notna() & c_dates.notna()
                if valid.any():
                    is_ordered = (c_dates[valid] >= p_dates[valid]).all()
                    if not is_ordered:
                        all_passed = False
                    checks.append({
                        "relation": f"{rel.parent}.{p_col} <= {rel.child}.{c_col}",
                        "compared_rows": int(valid.sum()),
                        "passed": bool(is_ordered)
                    })

        return {
            "passed": all_passed,
            "checks": checks
        }
