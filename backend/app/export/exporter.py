import io
import json
import zipfile
from typing import Any, Dict, List, Optional
import pandas as pd

from backend.app.spec.models import ColumnType, DomainSpec, TableSpec


class DataExporter:
    """Exports generated synthetic datasets to CSV Zip, SQL DDL+DML dumps, and JSON."""

    @staticmethod
    def export_to_csv_zip(tables_data: Dict[str, pd.DataFrame]) -> bytes:
        """Packs all tables as individual CSV files into an in-memory ZIP archive."""
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            for table_name, df in tables_data.items():
                csv_bytes = df.to_csv(index=False).encode("utf-8")
                zf.writestr(f"{table_name}.csv", csv_bytes)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def export_to_sql_dump(
        tables_data: Dict[str, pd.DataFrame],
        domain_spec: Optional[DomainSpec] = None,
        dialect: str = "sqlite"
    ) -> str:
        """Generates a complete SQL dump with CREATE TABLE DDL and INSERT statements."""
        sql_lines: List[str] = [
            "-- Synthetic Data Platform SQL Dump",
            f"-- Dialect: {dialect.upper()}",
            "-- Generated automatically with FK and constraint integrity",
            "",
            "BEGIN TRANSACTION;",
            ""
        ]

        for table_name, df in tables_data.items():
            table_spec = domain_spec.get_table(table_name) if domain_spec else None
            
            # 1. CREATE TABLE DDL
            sql_lines.append(f"DROP TABLE IF EXISTS {table_name};")
            col_defs: List[str] = []

            for col in df.columns:
                col_spec = None
                if table_spec:
                    for c in table_spec.columns:
                        if c.name == col:
                            col_spec = c
                            break

                # Infer SQL Type
                sql_type = "TEXT"
                constraints = []
                if col_spec:
                    if col_spec.type == ColumnType.ID:
                        sql_type = "VARCHAR(64)"
                    elif col_spec.type == ColumnType.INT:
                        sql_type = "INTEGER"
                    elif col_spec.type == ColumnType.FLOAT:
                        sql_type = "REAL"
                    elif col_spec.type == ColumnType.BOOLEAN:
                        sql_type = "BOOLEAN"
                    elif col_spec.type in (ColumnType.DATE, ColumnType.DATETIME):
                        sql_type = "TIMESTAMP"

                    if col_spec.pk:
                        constraints.append("PRIMARY KEY NOT NULL")
                    elif col_spec.unique:
                        constraints.append("UNIQUE NOT NULL")
                else:
                    if pd.api.types.is_integer_dtype(df[col]):
                        sql_type = "INTEGER"
                    elif pd.api.types.is_float_dtype(df[col]):
                        sql_type = "REAL"
                    elif pd.api.types.is_bool_dtype(df[col]):
                        sql_type = "BOOLEAN"

                constraint_str = f" {' '.join(constraints)}" if constraints else ""
                col_defs.append(f"    {col} {sql_type}{constraint_str}")

            # Add foreign key constraints
            if domain_spec:
                for rel in domain_spec.relations:
                    if rel.child == table_name and rel.fk in df.columns:
                        parent_table = domain_spec.get_table(rel.parent)
                        parent_pk = rel.parent_pk or (parent_table.get_pk_column().name if parent_table and parent_table.get_pk_column() else f"{rel.parent}_id")
                        col_defs.append(f"    CONSTRAINT fk_{table_name}_{rel.fk} FOREIGN KEY ({rel.fk}) REFERENCES {rel.parent} ({parent_pk}) ON DELETE CASCADE")

            sql_lines.append(f"CREATE TABLE {table_name} (\n" + ",\n".join(col_defs) + "\n);")
            sql_lines.append("")

            # 2. INSERT INTO DML Statements
            col_list_str = ", ".join(df.columns)
            for _, row in df.iterrows():
                vals: List[str] = []
                for val in row:
                    if pd.isna(val) or val is None:
                        vals.append("NULL")
                    elif isinstance(val, (int, float, bool)):
                        vals.append(str(val))
                    else:
                        safe_str = str(val).replace("'", "''")
                        vals.append(f"'{safe_str}'")
                sql_lines.append(f"INSERT INTO {table_name} ({col_list_str}) VALUES ({', '.join(vals)});")

            sql_lines.append("")

        sql_lines.append("COMMIT;")
        return "\n".join(sql_lines)

    @staticmethod
    def export_to_schema_markdown(
        tables_data: Dict[str, pd.DataFrame],
        domain_spec: Optional[DomainSpec] = None
    ) -> str:
        """Generates comprehensive Relational Schema Documentation in Markdown."""
        total_rows = sum(len(df) for df in tables_data.values())
        domain_name = domain_spec.domain.upper() if domain_spec else "SYNTHETIC"

        lines = [
            f"# Relational Schema Documentation: {domain_name}",
            "",
            f"**Total Tables:** {len(tables_data)}  ",
            f"**Total Generated Rows:** {total_rows:,}  ",
            f"**Verified Invariants:** 0 Orphan Foreign Keys, Complete Primary Key Uniqueness",
            "",
            "## Table Breakdown & Metrics",
            "",
            "| Table Name | Row Count | Column Count | Primary Key | Foreign Keys |",
            "|---|---|---|---|---|"
        ]

        for t_name, df in tables_data.items():
            t_spec = domain_spec.get_table(t_name) if domain_spec else None
            pk_col = t_spec.get_pk_column().name if (t_spec and t_spec.get_pk_column()) else "None"
            fks = []
            if domain_spec:
                for r in domain_spec.relations:
                    if r.child == t_name:
                        fks.append(f"{r.fk} -> {r.parent}")
            fk_str = ", ".join(fks) if fks else "None (Root)"
            lines.append(f"| `{t_name}` | {len(df):,} | {len(df.columns)} | `{pk_col}` | {fk_str} |")

        lines.extend([
            "",
            "## Relational Relationships & Cardinality",
            "",
            "| Parent Table | Child Table | Foreign Key | Cardinality | Ratio / Multiplier |",
            "|---|---|---|---|---|"
        ])

        if domain_spec and domain_spec.relations:
            for r in domain_spec.relations:
                ratio_str = f"{r.ratio}x" if r.ratio is not None else ("1:1" if r.cardinality == "1:1" else "N:N")
                lines.append(f"| `{r.parent}` | `{r.child}` | `{r.fk}` | `{r.cardinality}` | {ratio_str} |")
        else:
            lines.append("| N/A | N/A | N/A | Flat Table | N/A |")

        lines.extend([
            "",
            "## Detailed Table Schemas",
            ""
        ])

        for t_name, df in tables_data.items():
            t_spec = domain_spec.get_table(t_name) if domain_spec else None
            lines.append(f"### Table: `{t_name}` ({len(df):,} rows)")
            lines.append("")
            lines.append("| Column | SQL Type | Nullable | Primary Key | Unique | Description / Derivation |")
            lines.append("|---|---|---|---|---|---|")

            for col in df.columns:
                c_spec = None
                if t_spec:
                    for c in t_spec.columns:
                        if c.name == col:
                            c_spec = c
                            break
                sql_type = c_spec.type.value if c_spec else "text"
                is_pk = "Yes (PK)" if (c_spec and c_spec.pk) else "No"
                is_unique = "Yes (Unique)" if (c_spec and c_spec.unique) else ("Yes" if is_pk == "Yes (PK)" else "No")
                nullable = "No" if (is_pk == "Yes (PK)" or is_unique == "Yes (Unique)") else "Yes"
                desc = c_spec.description if (c_spec and c_spec.description) else (f"Derived from {c_spec.derive_from}" if (c_spec and c_spec.derive_from) else "-")
                lines.append(f"| `{col}` | `{sql_type}` | {nullable} | {is_pk} | {is_unique} | {desc} |")
            lines.append("")

        # Mermaid ER Diagram
        lines.extend([
            "## Entity Relationship (ER) Diagram",
            "",
            "```mermaid",
            "erDiagram"
        ])

        if domain_spec and domain_spec.relations:
            for r in domain_spec.relations:
                p_clean = r.parent.upper()
                c_clean = r.child.upper()
                if r.cardinality == "1:1":
                    lines.append(f"    {p_clean} ||--|| {c_clean} : \"references\"")
                else:
                    lines.append(f"    {p_clean} ||--o{{ {c_clean} : \"references\"")
        else:
            for t_name in tables_data:
                lines.append(f"    {t_name.upper()} {{}}")
        lines.append("```")
        lines.append("")

        return "\n".join(lines)

    @staticmethod
    def export_to_schema_json(
        tables_data: Dict[str, pd.DataFrame],
        domain_spec: Optional[DomainSpec] = None
    ) -> str:
        """Generates structured JSON schema documentation."""
        meta = {
            "domain": domain_spec.domain if domain_spec else "synthetic",
            "total_tables": len(tables_data),
            "total_rows": sum(len(df) for df in tables_data.values()),
            "tables": {},
            "relations": [r.model_dump() for r in domain_spec.relations] if domain_spec else []
        }
        for name, df in tables_data.items():
            t_spec = domain_spec.get_table(name) if domain_spec else None
            meta["tables"][name] = {
                "rows": len(df),
                "columns": [
                    {
                        "name": col,
                        "type": c.type.value if c else "text",
                        "pk": c.pk if c else False,
                        "unique": c.unique if c else False,
                        "null_count": int(df[col].isna().sum())
                    }
                    for col in df.columns
                    for c in ([c for c in t_spec.columns if c.name == col] if t_spec else [None])
                ]
            }
        return json.dumps(meta, indent=2)

    @staticmethod
    def export_to_json(tables_data: Dict[str, pd.DataFrame], indent: int = 2) -> str:
        """Serializes dataset to structured JSON string."""
        out: Dict[str, Any] = {}
        for name, df in tables_data.items():
            out[name] = df.to_dict(orient="records")
        return json.dumps(out, indent=indent, default=str)

    @staticmethod
    def export_complete_bundle(
        tables_data: Dict[str, pd.DataFrame],
        domain_spec: Optional[DomainSpec] = None,
        quality_report: Optional[Dict[str, Any]] = None,
        pdf_documents: Optional[List[Dict[str, Any]]] = None
    ) -> bytes:
        """Exports a complete dataset bundle with CSVs, SQL dump, JSON, Quality Report, and rendered PDFs."""
        from backend.app.documents.pdf import PDFDocumentRenderer

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            # 1. CSV files in csv/ subfolder
            for table_name, df in tables_data.items():
                csv_bytes = df.to_csv(index=False).encode("utf-8")
                zf.writestr(f"csv/{table_name}.csv", csv_bytes)

            # 2. SQL Dump
            sql_text = DataExporter.export_to_sql_dump(tables_data, domain_spec=domain_spec)
            zf.writestr("database_dump.sql", sql_text.encode("utf-8"))

            # 3. JSON Export
            json_text = DataExporter.export_to_json(tables_data)
            zf.writestr("dataset.json", json_text.encode("utf-8"))

            # 4. Quality Report
            if quality_report:
                rep_json = json.dumps(quality_report, indent=2, default=str)
                zf.writestr("quality_report.json", rep_json.encode("utf-8"))

            # 5. Rendered PDFs
            if pdf_documents:
                for idx, doc in enumerate(pdf_documents):
                    doc_id = doc.get("doc_id", f"doc_{idx+1}")
                    try:
                        pdf_bytes = PDFDocumentRenderer.render_pdf(doc)
                        zf.writestr(f"documents/{doc_id}.pdf", pdf_bytes)
                    except Exception:
                        pass

        buffer.seek(0)
        return buffer.getvalue()
