from collections import defaultdict, deque
import math
from typing import Any, Dict, List, Optional, Set, Tuple
import numpy as np
import pandas as pd

from backend.app.engines.tabular import TabularEngine
from backend.app.engines.text_fill import TextFillEngine
from backend.app.spec.models import (
    ChildCountSpec,
    ColumnSpec,
    ColumnType,
    DistributionType,
    DomainSpec,
    RelationSpec,
    TableSpec,
)


class RelationalEngine:
    """Orchestrates multi-table generation with topological sorting, FK integrity, and cross-table rules."""

    def __init__(self, tabular_engine: Optional[TabularEngine] = None, text_filler: Optional[TextFillEngine] = None):
        self.tabular_engine = tabular_engine or TabularEngine()
        self.text_filler = text_filler or TextFillEngine()

    def topological_sort(self, domain_spec: DomainSpec) -> List[TableSpec]:
        """Orders tables so parent tables are generated before child tables."""
        table_map = {t.name: t for t in domain_spec.tables}
        in_degree: Dict[str, int] = {t.name: 0 for t in domain_spec.tables}
        adj_list: Dict[str, List[str]] = defaultdict(list)

        for rel in domain_spec.relations:
            if rel.parent in table_map and rel.child in table_map and rel.parent != rel.child:
                adj_list[rel.parent].append(rel.child)
                in_degree[rel.child] += 1

        queue = deque([name for name, deg in in_degree.items() if deg == 0])
        ordered_names: List[str] = []

        while queue:
            node = queue.popleft()
            ordered_names.append(node)
            for neighbor in adj_list[node]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        # Handle any cycles or disconnected tables
        if len(ordered_names) < len(domain_spec.tables):
            for t in domain_spec.tables:
                if t.name not in ordered_names:
                    ordered_names.append(t.name)

        return [table_map[name] for name in ordered_names]

    def sample_child_counts(
        self,
        n_parents: int,
        child_count_spec: Optional[ChildCountSpec],
        rng: np.random.Generator
    ) -> np.ndarray:
        """Samples the number of child records for each parent record."""
        if not child_count_spec:
            return np.ones(n_parents, dtype=int)

        dist = child_count_spec.dist
        min_c = child_count_spec.min
        max_c = child_count_spec.max

        if dist == DistributionType.POISSON:
            lam = child_count_spec.lambda_ or 2.0
            counts = rng.poisson(lam=lam, size=n_parents)
        elif dist == DistributionType.UNIFORM:
            low = min_c
            high = max_c if max_c is not None else (min_c + 5)
            counts = rng.integers(low=low, high=high + 1, size=n_parents)
        else:
            counts = np.full(n_parents, max(1, min_c), dtype=int)

        # Apply bounds
        counts = np.maximum(counts, min_c)
        if max_c is not None:
            counts = np.minimum(counts, max_c)

        return counts

    def generate_relational(
        self,
        domain_spec: DomainSpec,
        seed: Optional[int] = None
    ) -> Dict[str, pd.DataFrame]:
        """Generates all tables with 100% FK integrity, exact cardinalities, and cross-table consistency."""
        master_seed = seed if seed is not None else domain_spec.seed
        rng = np.random.default_rng(master_seed)
        
        # Configure tabular engine with domain spec locale and currency
        self.tabular_engine.locale = domain_spec.locale
        self.tabular_engine.default_currency = domain_spec.currency

        # 1. Topologically sort tables
        ordered_tables = self.topological_sort(domain_spec)
        tables_data: Dict[str, pd.DataFrame] = {}

        # Pre-index relations by child table
        child_relations: Dict[str, List[RelationSpec]] = defaultdict(list)
        for rel in domain_spec.relations:
            child_relations[rel.child].append(rel)

        # 2. Sequential generation following dependency graph
        for t_idx, table_spec in enumerate(ordered_tables):
            t_seed = master_seed + (t_idx * 1000)
            rels = child_relations.get(table_spec.name, [])

            if not rels:
                # Root table (no parent relations)
                df = self.tabular_engine.generate_table(
                    table_spec=table_spec,
                    seed=t_seed,
                    global_edge_cases=domain_spec.edge_cases
                )
                tables_data[table_spec.name] = df
            else:
                # Child table: determine rows and link foreign keys
                primary_rel = rels[0]
                parent_df = tables_data[primary_rel.parent]
                parent_pk_col = primary_rel.parent_pk or self._find_pk_col(domain_spec.get_table(primary_rel.parent))

                if not parent_pk_col or parent_pk_col not in parent_df.columns:
                    parent_pk_col = parent_df.columns[0]

                parent_pks = parent_df[parent_pk_col].to_numpy()
                n_parents = len(parent_pks)

                # Determine child row count and FK mappings
                if primary_rel.cardinality == "1:1" or (primary_rel.ratio is not None and primary_rel.ratio == 1.0):
                    # 1:1 matching
                    child_rows = n_parents
                    fk_assignments = parent_pks.copy()
                elif primary_rel.ratio is not None and primary_rel.ratio > 0:
                    child_rows = max(1, int(round(n_parents * primary_rel.ratio)))
                    if primary_rel.ratio >= 1.0:
                        rep = int(round(primary_rel.ratio))
                        repeats = np.full(n_parents, rep, dtype=int)
                        diff = child_rows - int(repeats.sum())
                        if diff > 0:
                            repeats[:diff] += 1
                        elif diff < 0:
                            repeats[diff:] = np.maximum(1, repeats[diff:] - 1)
                        fk_assignments = np.repeat(parent_pks, repeats)[:child_rows]
                    else:
                        # Fraction ratio (e.g. 0.5 for leave requests)
                        fk_assignments = rng.choice(parent_pks, size=child_rows, replace=(child_rows > n_parents))
                elif primary_rel.child_count:
                    # Child count distribution
                    counts_per_parent = self.sample_child_counts(
                        n_parents, primary_rel.child_count, rng
                    )
                    fk_assignments = np.repeat(parent_pks, counts_per_parent)
                    child_rows = len(fk_assignments)
                else:
                    # Target row count from table spec with weighted sampling from parents
                    child_rows = table_spec.rows
                    # Uniform or gently weighted selection ensuring 0 orphan rows
                    fk_assignments = rng.choice(parent_pks, size=child_rows, replace=True)

                # Generate base child table
                child_spec_copy = table_spec.model_copy()
                child_spec_copy.rows = child_rows

                df = self.tabular_engine.generate_table(
                    table_spec=child_spec_copy,
                    seed=t_seed,
                    global_edge_cases=domain_spec.edge_cases
                )

                # Assign foreign key column
                df[primary_rel.fk] = fk_assignments[:len(df)]

                # Apply secondary parent relations if junction/N:N
                for sec_rel in rels[1:]:
                    if sec_rel.parent in tables_data:
                        sec_parent_df = tables_data[sec_rel.parent]
                        sec_pk_col = sec_rel.parent_pk or self._find_pk_col(domain_spec.get_table(sec_rel.parent)) or sec_parent_df.columns[0]
                        sec_pks = sec_parent_df[sec_pk_col].to_numpy()
                        df[sec_rel.fk] = rng.choice(sec_pks, size=len(df))

                # 3. Apply Cross-Table Rules (Date Ordering, Correlations, Invariants)
                df = self._apply_cross_table_rules(
                    child_name=table_spec.name,
                    child_df=df,
                    rels=rels,
                    tables_data=tables_data,
                    domain_spec=domain_spec,
                    rng=rng
                )

                tables_data[table_spec.name] = df

        # 4. Realism Pass: Text filling (merchants, ICD-10, real products, titles)
        for name, table_df in tables_data.items():
            tables_data[name] = self.text_filler.fill_realistic_text_for_table(
                table_name=name,
                df=table_df,
                domain=domain_spec.domain,
                rng=rng
            )

        return tables_data

    def _apply_cross_table_rules(
        self,
        child_name: str,
        child_df: pd.DataFrame,
        rels: List[RelationSpec],
        tables_data: Dict[str, pd.DataFrame],
        domain_spec: DomainSpec,
        rng: np.random.Generator
    ) -> pd.DataFrame:
        """Enforces cross-table constraints like child dates >= parent dates and column correlations."""
        df = child_df.copy()

        for rel in rels:
            parent_df = tables_data.get(rel.parent)
            if parent_df is None:
                continue

            parent_table_spec = domain_spec.get_table(rel.parent)
            child_table_spec = domain_spec.get_table(child_name)
            if not parent_table_spec or not child_table_spec:
                continue

            parent_pk = rel.parent_pk or self._find_pk_col(parent_table_spec) or parent_df.columns[0]
            fk_col = rel.fk

            # 1. Date consistency: child date >= parent date
            parent_date_cols = [c.name for c in parent_table_spec.columns if c.type in (ColumnType.DATE, ColumnType.DATETIME)]
            child_date_cols = [c.name for c in child_table_spec.columns if c.type in (ColumnType.DATE, ColumnType.DATETIME)]

            if parent_date_cols and child_date_cols and fk_col in df.columns:
                p_date_col = parent_date_cols[0]
                c_date_col = child_date_cols[0]

                parent_date_map = dict(zip(parent_df[parent_pk], parent_df[p_date_col]))
                parent_dates = df[fk_col].map(parent_date_map)

                try:
                    p_ts = pd.to_datetime(parent_dates)
                    c_ts = pd.to_datetime(df[c_date_col])

                    valid_mask = c_ts.notna() & p_ts.notna()
                    violations = valid_mask & (c_ts < p_ts)
                    if violations.any():
                        random_days = pd.to_timedelta(rng.integers(1, 180, size=violations.sum()), unit="D")
                        corrected_ts = c_ts.copy()
                        corrected_ts.loc[violations] = p_ts.loc[violations] + random_days

                        if "-" in str(df[c_date_col].dropna().iloc[0]) and len(str(df[c_date_col].dropna().iloc[0])) <= 10:
                            df.loc[violations, c_date_col] = corrected_ts.loc[violations].dt.strftime("%Y-%m-%d")
                        else:
                            df.loc[violations, c_date_col] = corrected_ts.loc[violations].dt.strftime("%Y-%m-%d %H:%M:%S")
                except Exception:
                    pass

            # 2. Correlation: Income <-> Balance (rho > 0.3)
            if "income" in parent_df.columns and "balance" in df.columns and fk_col in df.columns:
                income_map = dict(zip(parent_df[parent_pk], parent_df["income"]))
                mapped_income = df[fk_col].map(income_map).dropna()
                if len(mapped_income) > 0:
                    mean_inc = mapped_income.mean()
                    std_inc = max(mapped_income.std(), 1.0)
                    norm_inc = (df[fk_col].map(income_map).fillna(mean_inc) - mean_inc) / std_inc

                    base_bal = df["balance"].astype(float)
                    bal_std = max(base_bal.std(), 1.0)
                    correlated_bal = base_bal + 0.65 * bal_std * norm_inc
                    df["balance"] = np.round(np.clip(correlated_bal, 50.0, None), 2)

            # 3. Healthcare constraint: No impossible combos (gender male + pregnancy, age < 0)
            if "gender" in parent_df.columns and fk_col in df.columns:
                gender_map = dict(zip(parent_df[parent_pk], parent_df["gender"]))
                parent_gender = df[fk_col].map(gender_map)
                # If there are condition / diagnosis columns
                for cond_col in ("diagnosis", "condition", "test_name"):
                    if cond_col in df.columns:
                        male_mask = parent_gender == "male"
                        preg_mask = df[cond_col].astype(str).str.contains(r"pregnan|obstetric", case=False, na=False)
                        impossible = male_mask & preg_mask
                        if impossible.any():
                            # Replace with general safe diagnosis
                            df.loc[impossible, cond_col] = "Z00.00 - General Medical Examination"

        return df

    def _find_pk_col(self, table_spec: Optional[TableSpec]) -> Optional[str]:
        if not table_spec:
            return None
        pk = table_spec.get_pk_column()
        return pk.name if pk else None
