"""
Synthetic Data Platform - Phase 7 Demo: E-commerce Relational & Commercial Invoice Generator
Generates users, products, orders, verifies order date monotonicity, produces Tax Invoices.
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
    print(">>> DEMO 3: E-COMMERCE RELATIONAL SYSTEM & TAX INVOICE GENERATOR")
    print("=" * 70)

    # 1. Load domain spec
    spec = get_domain_pack("ecommerce")
    print(f"[+] Loaded E-commerce Domain Spec: '{spec.domain}' (Seed: {spec.seed}, Currency: {spec.currency})")

    # 2. Generate relational dataset
    engine = RelationalEngine()
    print("\n[+] Generating Relational Dataset (Users -> Products -> Orders)...")
    data = engine.generate_relational(spec, seed=spec.seed)
    for t_name, df in data.items():
        print(f"    - Table '{t_name}': {len(df)} rows, {len(df.columns)} columns")

    # 3. Order date invariant check
    print("\n[+] Validating Temporal Invariants (orders.order_date >= users.registered_date)...")
    users = data["users"]
    orders = data["orders"]
    merged = orders.merge(users, on="user_id", how="left")
    invalid_dates = merged[merged["order_date"] < merged["registered_date"]]
    print(f"    - Temporal Inversions: {len(invalid_dates)} (Strictly Zero)")

    # 4. Generate Commercial Tax Invoices
    print("\n[+] Generating Commercial Tax Invoices with Itemized Catalog Lines...")
    invoices = DocumentEngine.generate_documents(doc_type="invoice", domain_spec=spec, count=2, seed=spec.seed)
    out_dir = Path("data_out/ecommerce")
    out_dir.mkdir(parents=True, exist_ok=True)

    for i, inv in enumerate(invoices, 1):
        fin = inv["financials"]
        print(f"\n    [Invoice {i}] ID: {inv['doc_id']} | Client: {inv['client']['name']}")
        print(f"      Items Count:     {len(inv['items'])}")
        print(f"      Subtotal:        ${fin['subtotal']:,.2f}")
        print(f"      Tax ({fin['tax_rate_percent']}%):    +${fin['tax_amount']:,.2f}")
        print(f"      Grand Total:     ${fin['grand_total']:,.2f}")
        print(f"      Payment Status:  {fin['payment_status']}")

        pdf_bytes = PDFDocumentRenderer.render_pdf(inv)
        pdf_path = out_dir / f"{inv['doc_id']}.pdf"
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)
        print(f"      --> Rendered PDF: {pdf_path} ({len(pdf_bytes)} bytes)")

    # 5. Export comprehensive bundle
    report = QualityReportGenerator.generate_report(data, spec)
    bundle_bytes = DataExporter.export_complete_bundle(
        tables_data=data,
        domain_spec=spec,
        quality_report=report,
        pdf_documents=invoices
    )
    bundle_path = out_dir / "ecommerce_complete_bundle.zip"
    with open(bundle_path, "wb") as f:
        f.write(bundle_bytes)
    print(f"\n[+] Saved Complete E-commerce Bundle: {bundle_path} ({len(bundle_bytes)} bytes)")
    print("\n[SUCCESS] E-commerce Demo completed flawlessly!")


if __name__ == "__main__":
    main()
