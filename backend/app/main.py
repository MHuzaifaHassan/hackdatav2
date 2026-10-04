import io
import time
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
import pandas as pd

from backend.app.config import settings
from backend.app.documents.generator import DocumentEngine
from backend.app.domains.packs import get_available_domain_packs, get_domain_pack
from backend.app.engines.editor import DataEditor
from backend.app.engines.relational import RelationalEngine
from backend.app.engines.tabular import TabularEngine
from backend.app.evaluation import TSTREvaluationEngine, get_demo_dataset, DEMO_DATASETS
from backend.app.export.exporter import DataExporter
from backend.app.llm.provider import get_llm_provider
from backend.app.spec.infer import SpecInferenceEngine
from backend.app.spec.models import DomainSpec, TableSpec
from backend.app.spec.nlp_parser import parse_query_request, parse_column_prompt

import logging
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Synthetic Data Platform: Multi-domain tabular, relational, and document generation.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


@app.get("/")
async def root_index() -> Dict[str, Any]:
    """Root endpoint for status check and API metadata."""
    return {
        "status": "online",
        "message": "Synthetic Data Platform API is running",
        "version": settings.APP_VERSION,
        "docs_url": "/docs",
        "endpoints": [
            "/health",
            "/domains",
            "/spec/infer",
            "/generate/tabular",
            "/generate/relational",
            "/documents/generate",
            "/export/sql",
            "/export/zip"
        ]
    }


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Phase 0 Gate: Health check endpoint returning platform and provider status."""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "llm_provider": settings.LLM_PROVIDER,
        "default_locale": settings.DEFAULT_LOCALE,
        "default_currency": settings.DEFAULT_CURRENCY,
        "timestamp": time.time(),
    }


@app.get("/domains", response_model=List[str])
async def list_domains() -> List[str]:
    """Lists all available built-in domain packs."""
    return get_available_domain_packs()


@app.get("/domains/{domain_name}", response_model=DomainSpec)
async def get_domain(domain_name: str) -> DomainSpec:
    """Retrieves a pre-built DomainSpec for the specified domain pack."""
    return get_domain_pack(domain_name)


@app.post("/spec/infer", response_model=DomainSpec)
async def infer_domain_spec(payload: Dict[str, str]) -> DomainSpec:
    """Infers a DomainSpec from natural-language description with auto-repair & pack fallback."""
    prompt = payload.get("prompt", "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Field 'prompt' is required.")

    logger.info(f"[DEBUG Spec Inference] Received prompt: '{prompt}'")
    llm = get_llm_provider()
    spec = await SpecInferenceEngine.infer_from_prompt(prompt, llm=llm)
    logger.info(f"[DEBUG Spec Inference] Generated DomainSpec: {spec.model_dump_json(indent=2)}")
    return spec


@app.post("/spec/infer-csv", response_model=DomainSpec)
async def infer_from_csv_file(
    file: UploadFile = File(...),
    table_name: str = Query("uploaded_table"),
    domain_name: str = Query("custom_domain")
) -> DomainSpec:
    """Profiles an uploaded CSV file and generates a structured TableSpec & DomainSpec."""
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        spec = SpecInferenceEngine.infer_from_csv(df, table_name=table_name, domain_name=domain_name)
        return spec
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")


@app.post("/generate/tabular")
async def generate_tabular_data(
    spec: DomainSpec,
    table_name: Optional[str] = None,
    format: str = Query("json", pattern="^(json|csv)$")
) -> Any:
    """Generates synthetic tabular data for the provided DomainSpec."""
    engine = TabularEngine(locale=spec.locale, default_currency=spec.currency)

    # If specific table requested, generate single table
    target_table = None
    if table_name:
        target_table = spec.get_table(table_name)
        if not target_table:
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found in DomainSpec.")
    elif len(spec.tables) == 1:
        target_table = spec.tables[0]

    if target_table:
        df = engine.generate_table(
            table_spec=target_table,
            seed=spec.seed,
            global_edge_cases=spec.edge_cases
        )
        if format == "csv":
            csv_str = df.to_csv(index=False)
            return Response(content=csv_str, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={target_table.name}.csv"})
        return {
            "table": target_table.name,
            "rows": len(df),
            "columns": list(df.columns),
            "data": df.to_dict(orient="records")
        }

    # Generate all tables in the domain
    tables_dict = engine.generate_domain(spec)
    result = {
        "domain": spec.domain,
        "tables": {}
    }
    for name, df in tables_dict.items():
        result["tables"][name] = {
            "rows": len(df),
            "columns": list(df.columns),
            "data": df.to_dict(orient="records")
        }
    return result


@app.post("/generate/relational")
async def generate_relational_data(
    spec: DomainSpec,
    format: str = Query("json", pattern="^(json|zip|sql)$")
) -> Any:
    """Phase 3 & 4: Generates relational datasets with PK/FK integrity, cardinalities, realism & export options."""
    rel_engine = RelationalEngine()
    tables_data = rel_engine.generate_relational(spec, seed=spec.seed)

    if format == "zip":
        zip_bytes = DataExporter.export_to_csv_zip(tables_data)
        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={spec.domain}_relational_data.zip"}
        )
    elif format == "sql":
        sql_text = DataExporter.export_to_sql_dump(tables_data, domain_spec=spec)
        return Response(
            content=sql_text,
            media_type="application/sql",
            headers={"Content-Disposition": f"attachment; filename={spec.domain}_dump.sql"}
        )

    # Default JSON representation
    total_rows = sum(len(df) for df in tables_data.values())
    return {
        "domain": spec.domain,
        "seed": spec.seed,
        "locale": spec.locale,
        "currency": spec.currency,
        "total_rows": total_rows,
        "default_applied": getattr(spec, "default_applied", False),
        "default_note": getattr(spec, "default_note", None),
        "requested_rows": getattr(spec, "requested_rows", None),
        "relations": [r.model_dump() for r in spec.relations],
        "tables": {
            name: {
                "rows": len(df),
                "columns": list(df.columns),
                "sample": df.to_dict(orient="records"),
                "data": df.to_dict(orient="records"),
            }
            for name, df in tables_data.items()
        }
    }


@app.post("/export/sql")
async def export_sql_dump(spec: DomainSpec) -> Response:
    """Exports SQL DDL and DML for the requested DomainSpec."""
    rel_engine = RelationalEngine()
    tables_data = rel_engine.generate_relational(spec, seed=spec.seed)
    sql_text = DataExporter.export_to_sql_dump(tables_data, domain_spec=spec)
    return Response(
        content=sql_text,
        media_type="application/sql",
        headers={"Content-Disposition": f"attachment; filename={spec.domain}_dump.sql"}
    )


@app.post("/export/zip")
async def export_zip_bundle(spec: DomainSpec) -> Response:
    """Exports all tables as a zipped CSV archive."""
    rel_engine = RelationalEngine()
    tables_data = rel_engine.generate_relational(spec, seed=spec.seed)
    zip_bytes = DataExporter.export_to_csv_zip(tables_data)
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={spec.domain}_csv_bundle.zip"}
    )


@app.post("/export/dataset-zip")
async def export_dataset_zip(payload: Dict[str, Any]) -> Response:
    """Exports dataset records directly into a ZIP of CSVs without regenerating (single source of truth)."""
    dataset = payload.get("dataset", {})
    domain_name = payload.get("domain", "synthetic")
    if not dataset:
        raise HTTPException(status_code=400, detail="Dataset is empty or not provided.")
    
    tables_data = {t_name: pd.DataFrame(records) for t_name, records in dataset.items()}
    zip_bytes = DataExporter.export_to_csv_zip(tables_data)
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={domain_name}_dataset.zip"}
    )


@app.post("/export/schema-markdown")
async def export_schema_markdown(payload: Dict[str, Any]) -> Response:
    """Exports relational schema documentation in Markdown format."""
    spec_dict = payload.get("spec")
    spec = DomainSpec(**spec_dict) if spec_dict else None
    dataset = payload.get("dataset", {})

    if dataset:
        tables_data = {t_name: pd.DataFrame(records) for t_name, records in dataset.items()}
    elif spec:
        rel_engine = RelationalEngine()
        tables_data = rel_engine.generate_relational(spec, seed=spec.seed)
    else:
        raise HTTPException(status_code=400, detail="Spec or Dataset is required.")

    md_content = DataExporter.export_to_schema_markdown(tables_data, domain_spec=spec)
    filename = f"{spec.domain if spec else 'schema'}_documentation.md"
    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.post("/export/bundle")
async def export_full_bundle(payload: Dict[str, Any]) -> Response:
    """Exports a comprehensive ZIP archive containing CSVs, SQL dump, JSON, Quality Report, and generated PDFs."""
    from backend.app.validation.report import QualityReportGenerator

    spec_dict = payload.get("spec")
    if not spec_dict:
        raise HTTPException(status_code=400, detail="DomainSpec is required in payload.")
    spec = DomainSpec(**spec_dict)
    
    doc_type = payload.get("doc_type", "invoice")
    doc_count = int(payload.get("doc_count", 3))

    rel_engine = RelationalEngine()
    tables_data = rel_engine.generate_relational(spec, seed=spec.seed)
    quality_report = QualityReportGenerator.generate_report(tables_data, spec)
    
    pdf_docs = DocumentEngine.generate_documents(
        doc_type=doc_type,
        domain_spec=spec,
        count=doc_count,
        seed=spec.seed
    )

    bundle_bytes = DataExporter.export_complete_bundle(
        tables_data=tables_data,
        domain_spec=spec,
        quality_report=quality_report,
        pdf_documents=pdf_docs
    )

    return Response(
        content=bundle_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={spec.domain}_complete_bundle.zip"}
    )



@app.post("/documents/generate")
async def generate_documents_api(
    payload: Dict[str, Any]
) -> Dict[str, Any]:
    """Generates structured, mathematically reconciled synthetic documents (bank statements, invoices, lab reports, discharge summaries, insurance claims)."""
    doc_type = payload.get("doc_type", "invoice")
    count = int(payload.get("count", 5))
    seed = int(payload.get("seed", 42))

    spec_dict = payload.get("spec")
    domain_spec = DomainSpec(**spec_dict) if spec_dict else None

    docs = DocumentEngine.generate_documents(
        doc_type=doc_type,
        domain_spec=domain_spec,
        count=count,
        seed=seed
    )

    return {
        "doc_type": doc_type,
        "count": len(docs),
        "seed": seed,
        "documents": docs
    }


@app.post("/documents/pdf")
async def generate_document_pdf_api(
    payload: Dict[str, Any]
) -> Response:
    """Renders a structured document dictionary into a downloadable PDF binary stream."""
    from backend.app.documents.pdf import PDFDocumentRenderer
    doc = payload.get("document", payload)
    pdf_bytes = PDFDocumentRenderer.render_pdf(doc)
    doc_id = doc.get("doc_id", "document")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={doc_id}.pdf"}
    )


@app.post("/quality/report")
async def generate_quality_report_api(
    spec: DomainSpec
) -> Dict[str, Any]:
    """Generates a complete quality assurance audit report for a given DomainSpec."""
    from backend.app.validation.report import QualityReportGenerator
    rel_engine = RelationalEngine()
    tables_data = rel_engine.generate_relational(spec, seed=spec.seed)
    report = QualityReportGenerator.generate_report(tables_data, spec)
    return report


# ==========================================
# Feature 1 & 2: Query & Column NLP Parsing
# ==========================================

@app.post("/spec/parse-query")
async def parse_query_api(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Feature 1: Parse user plain-English prompt into structured dataset requirements.
    Returns: domain, locale, currency, per-table row counts, relations, applied defaults, constraints.
    """
    query = payload.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Field 'query' is required.")

    base_spec_data = payload.get("base_spec")
    base_spec = DomainSpec(**base_spec_data) if base_spec_data else None

    summary = parse_query_request(query, base_spec=base_spec)
    return summary


@app.post("/spec/parse-column")
async def parse_column_api(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Feature 2: Parses plain-English column requirements into structured column attributes.
    Example: 'salary in PKR, between 40,000 and 300,000, skewed low'
    """
    prompt = payload.get("prompt", "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Field 'prompt' is required.")

    return parse_column_prompt(prompt)


# ==========================================
# Feature 3: Editing Generated Data
# ==========================================

@app.post("/data/add-column")
async def add_column_api(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Adds a new column to an existing table, generating consistent values for all existing rows."""
    dataset = payload.get("dataset")
    table_name = payload.get("table_name")
    column_spec = payload.get("column_spec")
    spec_dict = payload.get("spec")
    locale = payload.get("locale", "en_US")
    currency = payload.get("currency", "USD")
    seed = int(payload.get("seed", 42))

    if not dataset or not table_name or not column_spec:
        raise HTTPException(status_code=400, detail="dataset, table_name, and column_spec are required.")

    try:
        res = DataEditor.add_column(
            dataset=dataset,
            table_name=table_name,
            column_spec_dict=column_spec,
            spec_dict=spec_dict,
            locale=locale,
            currency=currency,
            seed=seed
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/data/rename-column")
async def rename_column_api(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Renames a column across the dataset and updates the table specification."""
    dataset = payload.get("dataset")
    table_name = payload.get("table_name")
    old_name = payload.get("old_name")
    new_name = payload.get("new_name")
    spec_dict = payload.get("spec")

    if not dataset or not table_name or not old_name or not new_name:
        raise HTTPException(status_code=400, detail="dataset, table_name, old_name, and new_name are required.")

    return DataEditor.rename_column(dataset, table_name, old_name, new_name, spec_dict)


@app.post("/data/delete-column")
async def delete_column_api(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Deletes a column from an existing table across the dataset and specification."""
    dataset = payload.get("dataset")
    table_name = payload.get("table_name")
    column_name = payload.get("column_name")
    spec_dict = payload.get("spec")

    if not dataset or not table_name or not column_name:
        raise HTTPException(status_code=400, detail="dataset, table_name, and column_name are required.")

    return DataEditor.delete_column(dataset, table_name, column_name, spec_dict)


@app.post("/data/add-rows")
async def add_rows_api(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Appends rows with continuous PKs, 0 orphan FKs sampled strictly from parents,
    and unique constraint preservation.
    """
    dataset = payload.get("dataset")
    table_name = payload.get("table_name")
    count = int(payload.get("count", 1))
    spec_dict = payload.get("spec")
    seed = int(payload.get("seed", 42))

    if not dataset or not table_name:
        raise HTTPException(status_code=400, detail="dataset and table_name are required.")

    try:
        return DataEditor.add_rows(dataset, table_name, count=count, spec_dict=spec_dict, seed=seed)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/data/delete-row")
async def delete_row_api(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deletes a row with interactive cascade handling.
    Warns if children exist unless cascade=True.
    """
    dataset = payload.get("dataset")
    table_name = payload.get("table_name")
    row_index = payload.get("row_index")
    pk_value = payload.get("pk_value")
    spec_dict = payload.get("spec")
    cascade = bool(payload.get("cascade", False))

    if not dataset or not table_name:
        raise HTTPException(status_code=400, detail="dataset and table_name are required.")

    return DataEditor.delete_row(
        dataset=dataset,
        table_name=table_name,
        row_index=row_index,
        pk_value=pk_value,
        spec_dict=spec_dict,
        cascade=cascade
    )


@app.post("/data/reconcile")
async def reconcile_data_api(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Audits dataset for 0 orphan rows, unique PKs, and row consistency."""
    dataset = payload.get("dataset", {})
    spec_dict = payload.get("spec")
    return DataEditor.reconcile(dataset, spec_dict)


# ==========================================
# Feature 4: TSTR / TRTR Quality & Fidelity
# ==========================================

@app.get("/evaluation/demo-datasets")
async def list_evaluation_demo_datasets() -> Dict[str, Any]:
    """Returns available labeled demo datasets for TSTR benchmarking."""
    summary = {}
    for key, item in DEMO_DATASETS.items():
        summary[key] = {
            "key": key,
            "name": item["name"],
            "task_type": item["task_type"],
            "target_col": item["target_col"],
            "description": item["description"]
        }
    return {"datasets": summary}


@app.get("/evaluation/demo-dataset/{name}")
async def get_evaluation_demo_dataset(name: str, rows: int = Query(500)) -> Dict[str, Any]:
    """Fetches a demo dataset with sample records and column schema."""
    if name not in DEMO_DATASETS:
        raise HTTPException(status_code=404, detail=f"Demo dataset '{name}' not found.")

    df = get_demo_dataset(name, n_rows=rows)
    meta = DEMO_DATASETS[name]
    return {
        "key": name,
        "name": meta["name"],
        "task_type": meta["task_type"],
        "target_col": meta["target_col"],
        "rows": len(df),
        "columns": list(df.columns),
        "sample": df.head(10).to_dict(orient="records"),
        "data": df.to_dict(orient="records")
    }


@app.post("/evaluation/tstr")
async def evaluate_tstr_api(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes TSTR vs. TRTR benchmark with leakage prevention (80/20 train/test split),
    classification/regression model comparison, fidelity (KS, Frobenius), and privacy checks.
    """
    demo_key = payload.get("demo_dataset")
    target_col = payload.get("target_col")
    task_type = payload.get("task_type")
    custom_records = payload.get("data")
    seed = int(payload.get("seed", 42))

    if custom_records:
        df = pd.DataFrame(custom_records)
    elif demo_key and demo_key in DEMO_DATASETS:
        meta = DEMO_DATASETS[demo_key]
        target_col = target_col or meta["target_col"]
        task_type = task_type or meta["task_type"]
        df = get_demo_dataset(demo_key, n_rows=int(payload.get("rows", 600)), seed=seed)
    else:
        raise HTTPException(status_code=400, detail="Must provide either 'demo_dataset' key or 'data' records.")

    if not target_col or target_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"Valid 'target_col' is required. Available: {list(df.columns)}")

    try:
        report = TSTREvaluationEngine.evaluate(
            real_df=df,
            target_col=target_col,
            task_type=task_type,
            seed=seed
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"TSTR evaluation failed: {str(e)}")


@app.post("/evaluation/report-pdf")
async def export_tstr_pdf_report(payload: Dict[str, Any]) -> Response:
    """Renders a PDF export of a TSTR evaluation benchmark report."""
    report_data = payload.get("report", payload)
    try:
        pdf_bytes = TSTREvaluationEngine.generate_evaluation_pdf_report(report_data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=TSTR_Evaluation_Report.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@app.post("/sql/execute")
async def execute_sql_query(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Executes arbitrary SQL queries (SELECT, INSERT, UPDATE, DELETE, CREATE, DROP) against in-memory SQLite tables."""
    import sqlite3
    query = payload.get("query", "").strip()
    tables_data = payload.get("tables", {})
    if not query:
        raise HTTPException(status_code=400, detail="SQL query is required")

    # If no tables provided, supply rich default tables matching UI datasets
    if not tables_data:
        tables_data = {
            "bank_statements": [
                {"id": "TXN-101", "date": "2026-09-01", "description": "Salary Deposit - Acme Corp", "category": "Income", "amount": 85000.0, "type": "CREDIT", "balance": 85000.0},
                {"id": "TXN-102", "date": "2026-09-03", "description": "Utility Payment - Electricity", "category": "Utilities", "amount": 4250.0, "type": "DEBIT", "balance": 80750.0},
                {"id": "TXN-103", "date": "2026-09-07", "description": "Grocery Mart - Superstore", "category": "Groceries", "amount": 12700.0, "type": "DEBIT", "balance": 68050.0},
                {"id": "TXN-104", "date": "2026-09-10", "description": "Restaurant Payment - Bistro", "category": "Dining", "amount": 3600.0, "type": "DEBIT", "balance": 64450.0},
                {"id": "TXN-105", "date": "2026-09-14", "description": "Freelance Client Retainer", "category": "Income", "amount": 25000.0, "type": "CREDIT", "balance": 89450.0},
                {"id": "TXN-106", "date": "2026-09-18", "description": "Cloud Infrastructure Hosting", "category": "Technology", "amount": 8400.0, "type": "DEBIT", "balance": 81050.0},
                {"id": "TXN-107", "date": "2026-09-22", "description": "Mobile Broadband Subscription", "category": "Utilities", "amount": 2100.0, "type": "DEBIT", "balance": 78950.0},
                {"id": "TXN-108", "date": "2026-09-27", "description": "Fuel & Transport Refill", "category": "Travel", "amount": 5500.0, "type": "DEBIT", "balance": 73450.0},
            ],
            "customers": [
                {"customer_id": 10482, "name": "Ayesha Raza", "age": 27, "city": "Lahore", "income": 84200.0, "segment": "Premium", "status": "VALID"},
                {"customer_id": 10483, "name": "Tariq Mansoor", "age": 34, "city": "Multan", "income": 92500.0, "segment": "Standard", "status": "VALID"},
                {"customer_id": 10484, "name": "Zainab Malik", "age": 41, "city": "Karachi", "income": 110200.0, "segment": "Premium", "status": "VALID"},
                {"customer_id": 10485, "name": "Bilal Ahmed", "age": 29, "city": "Islamabad", "income": 76800.0, "segment": "Standard", "status": "VALID"},
                {"customer_id": 10486, "name": "Farhan Siddiqui", "age": 52, "city": "Faisalabad", "income": 131400.0, "segment": "Premium", "status": "VALID"},
                {"customer_id": 10487, "name": "Mariam Khan", "age": 38, "city": "Peshawar", "income": 88900.0, "segment": "Standard", "status": "VALID"},
                {"customer_id": 10488, "name": "Danyal Hashmi", "age": 45, "city": "Lahore", "income": 102300.0, "segment": "Premium", "status": "VALID"},
                {"customer_id": 10489, "name": "Sana Mir", "age": 31, "city": "Karachi", "income": 69400.0, "segment": "Standard", "status": "VALID"},
                {"customer_id": 10490, "name": "Hamza Ali", "age": 24, "city": "Quetta", "income": 58100.0, "segment": "Basic", "status": "VALID"},
                {"customer_id": 10491, "name": "Nida Yasir", "age": 47, "city": "Multan", "income": 97600.0, "segment": "Standard", "status": "VALID"},
            ],
            "orders": [
                {"order_id": "ORD-501", "customer_id": 10482, "product_id": "PRD-01", "order_date": "2026-09-05", "total": 12500.0, "status": "COMPLETED"},
                {"order_id": "ORD-502", "customer_id": 10483, "product_id": "PRD-02", "order_date": "2026-09-08", "total": 4500.0, "status": "COMPLETED"},
                {"order_id": "ORD-503", "customer_id": 10484, "product_id": "PRD-03", "order_date": "2026-09-12", "total": 18200.0, "status": "PENDING"},
                {"order_id": "ORD-504", "customer_id": 10485, "product_id": "PRD-01", "order_date": "2026-09-15", "total": 12500.0, "status": "COMPLETED"},
            ],
            "products": [
                {"product_id": "PRD-01", "name": "Enterprise Analytics Suite", "category": "Software", "price": 12500.0},
                {"product_id": "PRD-02", "name": "API Security Gateway", "category": "Security", "price": 4500.0},
                {"product_id": "PRD-03", "name": "Synthetic DAG Engine Pro", "category": "Data", "price": 18200.0},
            ],
            "payments": [
                {"payment_id": "PAY-901", "order_id": "ORD-501", "method": "Credit Card", "amount": 12500.0, "status": "CLEARED"},
                {"payment_id": "PAY-902", "order_id": "ORD-502", "method": "Bank Transfer", "amount": 4500.0, "status": "CLEARED"},
                {"payment_id": "PAY-903", "order_id": "ORD-503", "method": "Credit Card", "amount": 18200.0, "status": "AUTHORIZED"},
                {"payment_id": "PAY-904", "order_id": "ORD-504", "method": "Wire Transfer", "amount": 12500.0, "status": "CLEARED"},
            ]
        }

    conn = sqlite3.connect(":memory:")
    try:
        # Load tables into SQLite
        for table_name, rows in tables_data.items():
            if rows and isinstance(rows, list):
                df = pd.DataFrame(rows)
                df.to_sql(table_name, conn, index=False, if_exists="replace")

        start_t = time.time()
        clean_query = query.strip().rstrip(";")
        first_word = clean_query.split()[0].upper() if clean_query.split() else ""

        # Check if query is returning data (SELECT / PRAGMA / WITH / EXPLAIN)
        is_read_query = first_word in ["SELECT", "PRAGMA", "WITH", "EXPLAIN"]

        if is_read_query:
            result_df = pd.read_sql_query(clean_query, conn)
            duration_ms = round((time.time() - start_t) * 1000, 2)
            result_df = result_df.where(pd.notnull(result_df), None)
            return {
                "status": "success",
                "columns": list(result_df.columns),
                "rows": result_df.to_dict(orient="records"),
                "row_count": len(result_df),
                "execution_time_ms": duration_ms,
                "message": f"Query returned {len(result_df)} row(s)"
            }
        else:
            # Handles INSERT, UPDATE, DELETE, CREATE, DROP, ALTER
            cursor = conn.cursor()
            cursor.execute(clean_query)
            conn.commit()
            duration_ms = round((time.time() - start_t) * 1000, 2)
            affected = cursor.rowcount if cursor.rowcount >= 0 else 0

            # Attempt to show recent records from the modified table if identifiable
            peek_rows = []
            peek_cols = ["status", "operation", "rows_affected"]
            peek_rows.append({"status": "SUCCESS", "operation": first_word, "rows_affected": affected})

            return {
                "status": "success",
                "columns": peek_cols,
                "rows": peek_rows,
                "row_count": affected,
                "rows_affected": affected,
                "execution_time_ms": duration_ms,
                "message": f"Operation {first_word} executed successfully ({affected} row(s) affected)"
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "columns": [],
            "rows": [],
            "row_count": 0,
            "execution_time_ms": 0
        }
    finally:
        conn.close()


def _save_to_local_disk(filename: str, file_bytes: bytes) -> List[str]:
    """Helper to save generated file bytes directly to Desktop and Downloads on disk."""
    import os
    from pathlib import Path
    safe_filename = Path(filename).name
    saved_locations = []
    home = os.path.expanduser("~")
    candidate_dirs = [
        os.path.join(home, "OneDrive", "Desktop"),
        os.path.join(home, "Desktop"),
        os.path.join(home, "Downloads"),
    ]
    for dir_path in candidate_dirs:
        if os.path.isdir(dir_path):
            target_file = os.path.join(dir_path, safe_filename)
            try:
                with open(target_file, "wb") as f:
                    f.write(file_bytes)
                saved_locations.append(target_file)
            except Exception:
                pass
    return saved_locations


@app.post("/export/table-csv")
async def export_table_csv(payload: Dict[str, Any]) -> Response:
    """Exports a single table to CSV with UTF-8 BOM, strict filename header, and saves to disk."""
    table_name = payload.get("table_name", "table")
    rows = payload.get("rows", [])
    if not rows or len(rows) == 0:
        raise HTTPException(status_code=400, detail="Dataset is empty. Cannot export file.")

    df = pd.DataFrame(rows)
    # Prepend UTF-8 BOM for Microsoft Excel compatibility
    csv_text = "\ufeff" + df.to_csv(index=False)
    csv_bytes = csv_text.encode("utf-8")

    filename = f"{table_name}.csv" if not table_name.lower().endswith(".csv") else table_name
    _save_to_local_disk(filename, csv_bytes)

    return Response(
        content=csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@app.post("/export/tables-zip")
async def export_tables_zip(payload: Dict[str, Any]) -> Response:
    """Exports all dataset tables as a valid ZIP archive containing one CSV per table."""
    domain_name = payload.get("domain", "synthetic")
    tables = payload.get("tables", {})
    if not tables or all(len(rows) == 0 for rows in tables.values()):
        raise HTTPException(status_code=400, detail="Dataset is empty. Cannot export zip archive.")

    import zipfile
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for t_name, rows in tables.items():
            if rows and len(rows) > 0:
                df = pd.DataFrame(rows)
                csv_content = "\ufeff" + df.to_csv(index=False)
                zf.writestr(f"{t_name}.csv", csv_content.encode("utf-8"))

    zip_bytes = buffer.getvalue()
    filename = f"{domain_name}_tables.zip" if not domain_name.lower().endswith(".zip") else domain_name
    _save_to_local_disk(filename, zip_bytes)

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@app.post("/export/schema-sql")
async def export_schema_sql(payload: Dict[str, Any]) -> Response:
    """Exports relational schema and data as a valid .sql file with CREATE TABLE statements."""
    domain_name = payload.get("domain", "synthetic")
    tables = payload.get("tables", {})
    if not tables or all(len(rows) == 0 for rows in tables.values()):
        raise HTTPException(status_code=400, detail="Dataset is empty. Cannot export schema.")

    tables_data = {t_name: pd.DataFrame(rows) for t_name, rows in tables.items() if rows and len(rows) > 0}
    sql_text = DataExporter.export_to_sql_dump(tables_data)
    sql_bytes = sql_text.encode("utf-8")

    filename = f"{domain_name}_schema.sql" if not domain_name.lower().endswith(".sql") else domain_name
    _save_to_local_disk(filename, sql_bytes)

    return Response(
        content=sql_bytes,
        media_type="application/sql; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@app.post("/export/data-json")
async def export_data_json(payload: Dict[str, Any]) -> Response:
    """Exports dataset records as a formatted .json file."""
    domain_name = payload.get("domain", "synthetic")
    data = payload.get("data", {})
    if not data:
        raise HTTPException(status_code=400, detail="Dataset is empty. Cannot export JSON.")

    import json
    json_str = json.dumps(data, indent=2, default=str)
    json_bytes = json_str.encode("utf-8")

    filename = f"{domain_name}_data.json" if not domain_name.lower().endswith(".json") else domain_name
    _save_to_local_disk(filename, json_bytes)

    return Response(
        content=json_bytes,
        media_type="application/json; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@app.post("/export/schema-json")
async def export_schema_json(payload: Dict[str, Any]) -> Response:
    """Exports schema specification as a formatted .json file."""
    domain_name = payload.get("domain", "synthetic")
    schema = payload.get("schema", {})
    if not schema:
        raise HTTPException(status_code=400, detail="Schema is empty. Cannot export JSON.")

    import json
    json_str = json.dumps(schema, indent=2, default=str)
    json_bytes = json_str.encode("utf-8")

    filename = f"{domain_name}_schema.json" if not domain_name.lower().endswith(".json") else domain_name
    _save_to_local_disk(filename, json_bytes)

    return Response(
        content=json_bytes,
        media_type="application/json; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@app.post("/export/save-to-disk")
async def save_to_disk(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Saves a generated file (CSV, PDF, JSON, SQL) directly to Desktop and/or Downloads folders."""
    import os
    import base64
    from pathlib import Path

    filename = payload.get("filename", "export.dat")
    content = payload.get("content", "")
    is_base64 = payload.get("is_base64", False)

    safe_filename = Path(filename).name
    saved_locations = []

    home = os.path.expanduser("~")
    candidate_dirs = [
        os.path.join(home, "OneDrive", "Desktop"),
        os.path.join(home, "Desktop"),
        os.path.join(home, "Downloads"),
    ]

    try:
        if is_base64:
            file_bytes = base64.b64decode(content)
        elif isinstance(content, str):
            file_bytes = content.encode("utf-8")
        else:
            file_bytes = str(content).encode("utf-8")

        for dir_path in candidate_dirs:
            if os.path.isdir(dir_path):
                target_file = os.path.join(dir_path, safe_filename)
                try:
                    with open(target_file, "wb") as f:
                        f.write(file_bytes)
                    saved_locations.append(target_file)
                except Exception as write_err:
                    pass

        return {
            "status": "success",
            "filename": safe_filename,
            "saved_locations": saved_locations,
            "count": len(saved_locations),
            "message": f"Saved {safe_filename} directly to {len(saved_locations)} target folders on Desktop & Downloads"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "saved_locations": [],
            "count": 0
        }

