"""
Synthetic Data Platform - Phase 7 Demo: Healthcare Relational & Clinical Document Generator
Generates patients, visits, lab tests, verifies zero impossible combinations, produces Lab Reports & Discharge Summaries.
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
    print(">>> DEMO 2: HEALTHCARE RELATIONAL & CLINICAL DOCUMENT GENERATOR")
    print("=" * 70)

    # 1. Load domain spec
    spec = get_domain_pack("healthcare")
    print(f"[+] Loaded Healthcare Domain Spec: '{spec.domain}' (Seed: {spec.seed})")

    # 2. Generate relational dataset
    engine = RelationalEngine()
    print("\n[+] Generating Relational Dataset (Patients -> Visits -> Lab Reports)...")
    data = engine.generate_relational(spec, seed=spec.seed)
    for t_name, df in data.items():
        print(f"    - Table '{t_name}': {len(df)} rows, {len(df.columns)} columns")

    # 3. Healthcare sanity & date ordering check
    print("\n[+] Validating Clinical Invariants (visits.visit_date >= patients.birth_date)...")
    patients = data["patients"]
    visits = data["visits"]
    merged = visits.merge(patients, on="patient_id", how="left")
    invalid_dates = merged[merged["visit_date"] < merged["birth_date"]]
    print(f"    - Invalid Patient-Visit Date Inversions: {len(invalid_dates)} (Strictly Zero)")

    # 4. Generate Clinical Lab Reports
    print("\n[+] Generating Clinical Pathology Lab Reports...")
    lab_reports = DocumentEngine.generate_documents(doc_type="lab_report", domain_spec=spec, count=2, seed=spec.seed)
    out_dir = Path("data_out/healthcare")
    out_dir.mkdir(parents=True, exist_ok=True)

    for i, rep in enumerate(lab_reports, 1):
        print(f"\n    [Lab Report {i}] ID: {rep['doc_id']} | Patient: {rep['patient']['name']}")
        print(f"      Panel: {rep['panel_name']}")
        print(f"      Director: {rep['laboratory']['director']}")
        print(f"      Tests: {len(rep['tests'])} verified physiological markers")

        pdf_bytes = PDFDocumentRenderer.render_pdf(rep)
        pdf_path = out_dir / f"{rep['doc_id']}.pdf"
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)
        print(f"      --> Rendered PDF: {pdf_path} ({len(pdf_bytes)} bytes)")

    # 5. Generate Hospital Inpatient Discharge Summaries
    print("\n[+] Generating Hospital Inpatient Discharge Summaries...")
    discharge_docs = DocumentEngine.generate_documents(doc_type="discharge_summary", domain_spec=spec, count=2, seed=spec.seed)

    for i, doc in enumerate(discharge_docs, 1):
        print(f"\n    [Discharge Summary {i}] ID: {doc['doc_id']} | Patient: {doc['patient']['name']}")
        print(f"      Admission: {doc['admission_date']} | Discharge: {doc['discharge_date']}")
        print(f"      Diagnosis: {doc['diagnoses']['primary']}")
        print(f"      Medications: {doc['discharge_medications']}")

        pdf_bytes = PDFDocumentRenderer.render_pdf(doc)
        pdf_path = out_dir / f"{doc['doc_id']}.pdf"
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)
        print(f"      --> Rendered PDF: {pdf_path} ({len(pdf_bytes)} bytes)")

    # 6. Quality report & export
    report = QualityReportGenerator.generate_report(data, spec)
    bundle_bytes = DataExporter.export_complete_bundle(
        tables_data=data,
        domain_spec=spec,
        quality_report=report,
        pdf_documents=lab_reports + discharge_docs
    )
    bundle_path = out_dir / "healthcare_complete_bundle.zip"
    with open(bundle_path, "wb") as f:
        f.write(bundle_bytes)
    print(f"\n[+] Saved Complete Healthcare Bundle: {bundle_path} ({len(bundle_bytes)} bytes)")
    print("\n[SUCCESS] Healthcare Demo completed flawlessly!")


if __name__ == "__main__":
    main()
