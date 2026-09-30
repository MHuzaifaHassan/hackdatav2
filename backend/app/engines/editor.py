"""
Data Editing and Live Modification Engine.
Supports column additions/renames/deletions, continuous PK row generation,
cascade deletions, and relational integrity reconciliation.
"""
import copy
import re
from typing import Any, Dict, List, Optional, Tuple, Set
import numpy as np
import pandas as pd

from backend.app.engines.tabular import TabularEngine
from backend.app.spec.models import DomainSpec, TableSpec, ColumnSpec, ColumnType
from backend.app.validation.reconcile import InvariantReconciler


class DataEditor:
    """Manages in-memory live dataset mutations with strict relational integrity."""

    @staticmethod
    def add_column(
        dataset: Dict[str, List[Dict[str, Any]]],
        table_name: str,
        column_spec_dict: Dict[str, Any],
        spec_dict: Optional[Dict[str, Any]] = None,
        locale: str = "en_US",
        currency: str = "USD",
        seed: int = 42
    ) -> Dict[str, Any]:
        """
        Adds a new column to the specified table, generating consistent values
        for all existing N rows adhering to type, locale, and constraints.
        """
        table_rows = dataset.get(table_name, [])
        n_rows = len(table_rows)

        col_spec = ColumnSpec(**column_spec_dict)
        col_name = col_spec.name

        # Create a single-column TableSpec to generate consistent values
        single_table_spec = TableSpec(
            name=table_name,
            rows=max(n_rows, 1),
            columns=[col_spec]
        )

        engine = TabularEngine(locale=locale, default_currency=currency)
        df_gen = engine.generate_table(single_table_spec, seed=seed)
        new_values = df_gen[col_name].tolist() if col_name in df_gen else [None] * n_rows

        # Inject into existing rows
        updated_dataset = copy.deepcopy(dataset)
        for i, row in enumerate(updated_dataset.get(table_name, [])):
            row[col_name] = new_values[i] if i < len(new_values) else None

        # Update spec if provided
        updated_spec = copy.deepcopy(spec_dict) if spec_dict else None
        if updated_spec:
            for t in updated_spec.get("tables", []):
                if t.get("name") == table_name:
                    # Avoid duplicate column in spec
                    cols = [c for c in t.get("columns", []) if c.get("name") != col_name]
                    cols.append(col_spec.model_dump())
                    t["columns"] = cols
                    break

        all_columns = list(updated_dataset[table_name][0].keys()) if updated_dataset[table_name] else [col_name]

        return {
            "success": True,
            "table_name": table_name,
            "column_name": col_name,
            "dataset": updated_dataset,
            "columns": all_columns,
            "spec": updated_spec
        }

    @staticmethod
    def rename_column(
        dataset: Dict[str, List[Dict[str, Any]]],
        table_name: str,
        old_name: str,
        new_name: str,
        spec_dict: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Renames a column in dataset and spec."""
        if not new_name or old_name == new_name:
            return {"success": True, "dataset": dataset, "spec": spec_dict}

        updated_dataset = copy.deepcopy(dataset)
        for row in updated_dataset.get(table_name, []):
            if old_name in row:
                row[new_name] = row.pop(old_name)

        updated_spec = copy.deepcopy(spec_dict) if spec_dict else None
        if updated_spec:
            for t in updated_spec.get("tables", []):
                if t.get("name") == table_name:
                    for c in t.get("columns", []):
                        if c.get("name") == old_name:
                            c["name"] = new_name
                    break

        all_columns = list(updated_dataset[table_name][0].keys()) if updated_dataset.get(table_name) else []

        return {
            "success": True,
            "table_name": table_name,
            "old_name": old_name,
            "new_name": new_name,
            "dataset": updated_dataset,
            "columns": all_columns,
            "spec": updated_spec
        }

    @staticmethod
    def delete_column(
        dataset: Dict[str, List[Dict[str, Any]]],
        table_name: str,
        column_name: str,
        spec_dict: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Deletes a column from dataset and spec."""
        updated_dataset = copy.deepcopy(dataset)
        for row in updated_dataset.get(table_name, []):
            row.pop(column_name, None)

        updated_spec = copy.deepcopy(spec_dict) if spec_dict else None
        if updated_spec:
            for t in updated_spec.get("tables", []):
                if t.get("name") == table_name:
                    t["columns"] = [c for c in t.get("columns", []) if c.get("name") != column_name]
                    break

        all_columns = list(updated_dataset[table_name][0].keys()) if updated_dataset.get(table_name) else []

        return {
            "success": True,
            "table_name": table_name,
            "column_name": column_name,
            "dataset": updated_dataset,
            "columns": all_columns,
            "spec": updated_spec
        }

    @classmethod
    def add_rows(
        cls,
        dataset: Dict[str, List[Dict[str, Any]]],
        table_name: str,
        count: int = 1,
        spec_dict: Optional[Dict[str, Any]] = None,
        seed: int = 42
    ) -> Dict[str, Any]:
        """
        Generates continuous primary keys (e.g. CUST-00101 after CUST-00100),
        samples foreign keys strictly from existing parent PKs (0 orphans),
        preserves unique constraints, and returns updated dataset.
        """
        rng = np.random.default_rng(seed)
        updated_dataset = copy.deepcopy(dataset)
        existing_rows = updated_dataset.get(table_name, [])

        spec = DomainSpec(**spec_dict) if spec_dict else None
        target_table_spec = spec.get_table(table_name) if spec else None

        # 1. Identify PK column and determine next continuous IDs
        pk_col_name = None
        prefix = ""
        digits_len = 5
        max_id_num = 0
        is_numeric_pk = False

        if target_table_spec:
            for col in target_table_spec.columns:
                if col.pk:
                    pk_col_name = col.name
                    prefix = col.prefix or ""
                    break

        # Fallback PK detection
        if not pk_col_name and existing_rows:
            for k in existing_rows[0].keys():
                if k.endswith("_id") or k == "id":
                    pk_col_name = k
                    break

        if pk_col_name and existing_rows:
            for r in existing_rows:
                val = str(r.get(pk_col_name, ""))
                num_match = re.search(r"(\d+)$", val)
                if num_match:
                    num_val = int(num_match.group(1))
                    if num_val > max_id_num:
                        max_id_num = num_val
                        digits_len = len(num_match.group(1))
                        prefix_match = re.match(r"^(.*?)(\d+)$", val)
                        if prefix_match:
                            prefix = prefix_match.group(1)

        # 2. Identify Foreign Key parent relationships to sample strictly from parent rows (0 orphans)
        fk_parents: Dict[str, List[Any]] = {}  # col_name -> list of parent PKs
        if spec:
            for rel in spec.relations:
                if rel.child == table_name:
                    fk_col = rel.fk
                    parent_table_name = rel.parent
                    parent_spec = spec.get_table(parent_table_name)
                    parent_pk = None
                    if parent_spec:
                        for c in parent_spec.columns:
                            if c.pk:
                                parent_pk = c.name
                                break
                    if not parent_pk:
                        parent_pk = fk_col

                    parent_rows = updated_dataset.get(parent_table_name, [])
                    parent_ids = [r.get(parent_pk) for r in parent_rows if r.get(parent_pk) is not None]
                    if parent_ids:
                        fk_parents[fk_col] = parent_ids

        # 3. Generate raw values using TabularEngine for the batch
        batch_size = max(1, count)
        locale = spec.locale if spec else "en_US"
        currency = spec.currency if spec else "USD"
        engine = TabularEngine(locale=locale, default_currency=currency)

        if target_table_spec:
            mock_table_spec = target_table_spec.model_copy(deep=True)
            mock_table_spec.rows = batch_size
            gen_df = engine.generate_table(mock_table_spec, seed=seed)
            gen_rows = gen_df.to_dict(orient="records")
        elif existing_rows:
            # Replicate structure of existing row
            gen_rows = [copy.deepcopy(existing_rows[i % len(existing_rows)]) for i in range(batch_size)]
        else:
            gen_rows = [{} for _ in range(batch_size)]

        # 4. Post-process to ensure Continuous PK, 0 orphan FKs, and Unique fields
        new_rows = []
        for i, row in enumerate(gen_rows):
            # Assign continuous PK
            if pk_col_name:
                next_num = max_id_num + i + 1
                if prefix:
                    row[pk_col_name] = f"{prefix}{next_num:0{digits_len}d}"
                else:
                    row[pk_col_name] = next_num

            # Assign strictly valid parent FK
            for fk_col, parent_id_list in fk_parents.items():
                row[fk_col] = rng.choice(parent_id_list)

            # Ensure unique email if exists
            if "email" in row:
                base_email = str(row["email"]).split("@")[0]
                row["email"] = f"{base_email}{max_id_num + i + 1}@example.com"

            new_rows.append(row)

        existing_rows.extend(new_rows)
        updated_dataset[table_name] = existing_rows

        # Update spec table rows
        updated_spec = copy.deepcopy(spec_dict) if spec_dict else None
        if updated_spec:
            for t in updated_spec.get("tables", []):
                if t.get("name") == table_name:
                    t["rows"] = len(existing_rows)
                    break

        return {
            "success": True,
            "table_name": table_name,
            "added_count": len(new_rows),
            "total_rows": len(existing_rows),
            "added_rows": new_rows,
            "dataset": updated_dataset,
            "spec": updated_spec
        }

    @classmethod
    def delete_row(
        cls,
        dataset: Dict[str, List[Dict[str, Any]]],
        table_name: str,
        row_index: Optional[int] = None,
        pk_value: Optional[Any] = None,
        spec_dict: Optional[Dict[str, Any]] = None,
        cascade: bool = False
    ) -> Dict[str, Any]:
        """
        Interactive cascade handling:
        Deleting a parent cascades to related child rows or warns if children exist,
        ensuring 0 orphan rows.
        """
        updated_dataset = copy.deepcopy(dataset)
        rows = updated_dataset.get(table_name, [])

        spec = DomainSpec(**spec_dict) if spec_dict else None
        target_table_spec = spec.get_table(table_name) if spec else None

        pk_col_name = None
        if target_table_spec:
            for col in target_table_spec.columns:
                if col.pk:
                    pk_col_name = col.name
                    break

        if not pk_col_name and rows:
            for k in rows[0].keys():
                if k.endswith("_id") or k == "id":
                    pk_col_name = k
                    break

        # Locate target row
        target_row = None
        target_idx = None
        if pk_value is not None and pk_col_name:
            for idx, r in enumerate(rows):
                if str(r.get(pk_col_name)) == str(pk_value):
                    target_row = r
                    target_idx = idx
                    break
        elif row_index is not None and 0 <= row_index < len(rows):
            target_idx = row_index
            target_row = rows[row_index]
            if pk_col_name:
                pk_value = target_row.get(pk_col_name)

        if target_row is None:
            return {"success": False, "error": f"Row not found in {table_name}"}

        # Check for dependent child rows in other tables
        dependent_counts: Dict[str, int] = {}
        child_relations = []
        if spec and pk_value is not None:
            for rel in spec.relations:
                if rel.parent == table_name:
                    child_table = rel.child
                    fk_col = rel.fk
                    c_rows = updated_dataset.get(child_table, [])
                    matching_count = sum(1 for cr in c_rows if str(cr.get(fk_col)) == str(pk_value))
                    if matching_count > 0:
                        dependent_counts[child_table] = matching_count
                        child_relations.append((child_table, fk_col))

        # If children exist and cascade is NOT enabled, prompt confirmation
        if dependent_counts and not cascade:
            return {
                "success": False,
                "requires_cascade": True,
                "table_name": table_name,
                "pk_value": pk_value,
                "row_index": target_idx,
                "dependent_records": dependent_counts,
                "message": f"Row has {sum(dependent_counts.values())} dependent record(s) in child tables: {dependent_counts}. Confirm cascade delete to maintain 0 orphan rows."
            }

        # Cascade delete child records
        cascade_deleted: Dict[str, int] = {}
        if child_relations and cascade and pk_value is not None:
            for child_table, fk_col in child_relations:
                c_rows = updated_dataset.get(child_table, [])
                initial_count = len(c_rows)
                # Keep only rows not matching the parent PK
                remaining_rows = [cr for cr in c_rows if str(cr.get(fk_col)) != str(pk_value)]
                removed_count = initial_count - len(remaining_rows)
                updated_dataset[child_table] = remaining_rows
                cascade_deleted[child_table] = removed_count

                # Further cascade if child is parent to grandchild tables
                for sub_rel in spec.relations:
                    if sub_rel.parent == child_table:
                        grandchild_table = sub_rel.child
                        gc_fk = sub_rel.fk
                        gc_rows = updated_dataset.get(grandchild_table, [])
                        gc_initial = len(gc_rows)
                        # Remove grandchildren referencing any deleted child records
                        child_pks_deleted = {str(cr.get(sub_rel.fk or f"{child_table}_id")) for cr in c_rows if str(cr.get(fk_col)) == str(pk_value)}
                        gc_remaining = [gcr for gcr in gc_rows if str(gcr.get(gc_fk)) not in child_pks_deleted]
                        updated_dataset[grandchild_table] = gc_remaining
                        cascade_deleted[grandchild_table] = gc_initial - len(gc_remaining)

        # Delete the row itself
        rows.pop(target_idx)
        updated_dataset[table_name] = rows

        # Update spec table row counts
        updated_spec = copy.deepcopy(spec_dict) if spec_dict else None
        if updated_spec:
            for t in updated_spec.get("tables", []):
                if t.get("name") in updated_dataset:
                    t["rows"] = len(updated_dataset[t["name"]])

        # Verify integrity post-deletion
        reconcile_result = cls.reconcile(updated_dataset, updated_spec)

        return {
            "success": True,
            "table_name": table_name,
            "deleted_pk": pk_value,
            "cascade_deleted": cascade_deleted,
            "dataset": updated_dataset,
            "spec": updated_spec,
            "reconciliation": reconcile_result
        }

    @staticmethod
    def reconcile(
        dataset: Dict[str, List[Dict[str, Any]]],
        spec_dict: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Runs audit checks for zero orphan rows, unique PKs, and row consistency."""
        tables_df = {t_name: pd.DataFrame(rows) for t_name, rows in dataset.items()}
        spec = DomainSpec(**spec_dict) if spec_dict else None

        total_rows = sum(len(df) for df in tables_df.values())
        duplicate_pks = 0
        orphan_records = 0

        # Check PK uniqueness
        if spec:
            for t_spec in spec.tables:
                pk_col = None
                for c in t_spec.columns:
                    if c.pk:
                        pk_col = c.name
                        break
                if pk_col and t_spec.name in tables_df and not tables_df[t_spec.name].empty:
                    df = tables_df[t_spec.name]
                    if pk_col in df.columns:
                        dups = df[pk_col].duplicated().sum()
                        duplicate_pks += int(dups)

        # Check FK integrity
        fk_audit = {"passed": True, "total_orphan_records": 0, "violations": []}
        if spec:
            fk_audit = InvariantReconciler.check_fk_integrity(tables_df, spec)
            orphan_records = fk_audit.get("total_orphan_records", 0)

        passed = duplicate_pks == 0 and orphan_records == 0

        return {
            "passed": passed,
            "orphan_rows": orphan_records,
            "duplicate_pks": duplicate_pks,
            "total_rows": total_rows,
            "fk_audit": fk_audit
        }
