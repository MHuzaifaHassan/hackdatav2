"""
Synthetic Data Platform - Phase 7 Demo: Fintech Relational & Document Generation
Generates customers, accounts, transactions, verifies mathematical invariants, produces bank statement PDFs.
"""
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from backend.app.domains.packs import get_domain_pack
from backend.app.engines.relational import RelationalEngine
from backend.app.documents.generator import DocumentEngine
from backend.app.documents.pdf import PDFDocumentRenderer
from backend.app.validation.report import QualityReportGenerator
from backend.app.export.exporter import DataExporter


def main():
    print("=" * 70)
    print(">>> DEMO 1: FINTECH RELATIONAL SYSTEM & DOCUMENT GENERATOR")
    print("=" * 70)

    # 1. Load domain spec
    spec = get_domain_pack("fintech")
    print(f"[+] Loaded Domain Spec: '{spec.domain}' (Seed: {spec.seed}, Currency: {spec.currency})")
    print(f"    Tables: {[t.name for t in spec.tables]}")

    # 2. Generate relational dataset
    engine = RelationalEngine()
    print("\n[+] Generating Relational Dataset (DAG topological sort, PK/FK integrity)...")
    data = engine.generate_relational(spec, seed=spec.seed)
    for t_name, df in data.items():
        print(f"    - Table '{t_name}': {len(df)} rows, {len(df.columns)} columns")

    # 3. Quality audit
    print("\n[+] Running Quality & Mathematical Invariant Audit...")
    report = QualityReportGenerator.generate_report(data, spec)
    print(f"    - Overall Grade: {report['overall_grade']}")
    print(f"    - Relational FK Integrity: {report['summary']['fk_integrity_score']}")
    print(f"    - Date Ordering Valid: {report['summary']['date_invariants_valid']}")
    print(f"    - Privacy Leakage Check: {report['summary']['privacy_leakage_check']}")

    # 4. Generate Bank Statements
    print("\n[+] Generating Bank Statement Documents with LangGraph Grounding...")
    statements = DocumentEngine.generate_documents(doc_type="bank_statement", domain_spec=spec, count=2, seed=spec.seed)
    out_dir = Path("data_out/fintech")
    out_dir.mkdir(parents=True, exist_ok=True)

    for i, stmt in enumerate(statements, 1):
        print(f"\n    [Statement {i}] ID: {stmt['doc_id']} | Holder: {stmt['customer']['name']}")
        print(f"      Opening Balance: ${stmt['account']['opening_balance']:,.2f}")
        print(f"      Total Credits:   +${stmt['account']['total_credits']:,.2f}")
        print(f"      Total Debits:    -${stmt['account']['total_debits']:,.2f}")
        print(f"      Closing Balance: ${stmt['account']['closing_balance']:,.2f}")
        print(f"      Math Verified:   {stmt['account']['reconciled']} (Running balances reconciled)")

        # Render PDF
        pdf_bytes = PDFDocumentRenderer.render_pdf(stmt)
        pdf_path = out_dir / f"{stmt['doc_id']}.pdf"
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)
        print(f"      --> Rendered PDF: {pdf_path} ({len(pdf_bytes)} bytes)")

    # 5. Export comprehensive bundle
    print("\n[+] Exporting Complete Dataset Bundle (CSVs, SQL DDL+DML, JSON, Quality Report, PDFs)...")
    bundle_bytes = DataExporter.export_complete_bundle(
        tables_data=data,
        domain_spec=spec,
        quality_report=report,
        pdf_documents=statements
    )
    bundle_path = out_dir / "fintech_complete_bundle.zip"
    with open(bundle_path, "wb") as f:
        f.write(bundle_bytes)
    print(f"    --> Saved Archive: {bundle_path} ({len(bundle_bytes)} bytes)")
    print("\n[SUCCESS] Fintech Demo completed flawlessly!")


if __name__ == "__main__":
    main()
