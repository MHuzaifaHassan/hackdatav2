import pytest
from backend.app.documents.generator import DocumentEngine
from backend.app.documents.graph import LangGraphDocumentGenerator
from backend.app.documents.pdf import PDFDocumentRenderer
from backend.app.domains.packs import get_domain_pack


def test_bank_statement_math_and_running_balance():
    """Phase 5 Gate: Bank statement math: opening + credits - debits == closing, running balance correct per row."""
    spec = get_domain_pack("fintech")
    statements = DocumentEngine.generate_documents(doc_type="bank_statement", domain_spec=spec, count=5, seed=42)
    assert len(statements) >= 1

    for stmt in statements:
        acc = stmt["account"]
        opening = acc["opening_balance"]
        credits = acc["total_credits"]
        debits = acc["total_debits"]
        closing = acc["closing_balance"]

        # Math verification
        expected_closing = round(opening + credits - debits, 2)
        assert abs(expected_closing - closing) < 0.01, f"Statement {stmt['doc_id']} math mismatch: {expected_closing} != {closing}"

        # Row by row running balance check
        current = opening
        sum_credits = 0.0
        sum_debits = 0.0
        for txn in stmt["transactions"]:
            if txn["type"] == "Credit":
                current = round(current + txn["amount"], 2)
                sum_credits += txn["amount"]
            else:
                current = round(current - txn["amount"], 2)
                sum_debits += txn["amount"]
            assert abs(current - txn["running_balance"]) < 0.01

        assert abs(sum_credits - credits) < 0.01
        assert abs(sum_debits - debits) < 0.01


def test_invoice_math_reconciliation():
    """Phase 5 Gate: Every invoice: sum(items) + tax == grand_total (to the cent)."""
    spec = get_domain_pack("ecommerce")
    invoices = DocumentEngine.generate_documents(doc_type="invoice", domain_spec=spec, count=5, seed=42)
    assert len(invoices) >= 1

    for inv in invoices:
        items = inv["items"]
        fin = inv["financials"]

        # Sum of items
        item_sum = round(sum(item["amount"] for item in items), 2)
        assert abs(item_sum - fin["subtotal"]) < 0.01

        # Subtotal + tax == grand_total
        expected_grand = round(fin["subtotal"] + fin["tax_amount"], 2)
        assert abs(expected_grand - fin["grand_total"]) < 0.01


def test_clinical_lab_report_physiological_ranges():
    """Phase 5 Gate: Lab reports have physiological reference ranges and valid flags."""
    spec = get_domain_pack("healthcare")
    lab_reports = DocumentEngine.generate_documents(doc_type="lab_report", domain_spec=spec, count=3, seed=42)
    assert len(lab_reports) >= 1

    for report in lab_reports:
        assert "Laboratory Report" in report["doc_type"]
        assert "patient" in report
        assert "tests" in report
        assert len(report["tests"]) > 0

        for t in report["tests"]:
            assert "name" in t
            assert "val" in t
            assert "range" in t
            assert t["status"] in ("Normal", "High", "Low", "Desirable")


def test_discharge_summary_monotonic_dates_and_diagnosis():
    """Phase 5 Gate: Discharge summary admission_date <= discharge_date and valid ICD-10."""
    spec = get_domain_pack("healthcare")
    summaries = DocumentEngine.generate_documents(doc_type="discharge_summary", domain_spec=spec, count=3, seed=42)
    assert len(summaries) >= 1

    for doc in summaries:
        assert "Discharge Summary" in doc["doc_type"]
        assert "admission_date" in doc
        assert "discharge_date" in doc
        assert doc["admission_date"] <= doc["discharge_date"]
        assert "diagnoses" in doc
        assert "discharge_medications" in doc


def test_insurance_claim_reconciliation():
    """Phase 5 Gate: Insurance claim billed == allowed + deductible + coinsurance math."""
    spec = get_domain_pack("healthcare")
    claims = DocumentEngine.generate_documents(doc_type="insurance_claim", domain_spec=spec, count=3, seed=42)
    assert len(claims) >= 1

    for claim in claims:
        assert "Explanation of Benefits" in claim["doc_type"]
        svc = claim["service_details"]
        billed = svc["billed_amount"]
        allowed = svc["plan_allowed_amount"]
        assert billed >= allowed
        assert svc["plan_paid_amount"] >= 0


def test_langgraph_7_node_pipeline():
    """Phase 5 Gate: LangGraph 7-node pipeline runs successfully."""
    graph = LangGraphDocumentGenerator()
    state = graph.run("Generate 2 monthly bank statements for fintech customers", count=2, seed=100)
    assert state.validation_passed is True
    assert len(state.rendered_docs) == 2
    assert len(state.rendered_pdfs) == 2
    for pdf_bytes in state.rendered_pdfs:
        assert pdf_bytes.startswith(b"%PDF-")


def test_pdf_renderer_generates_valid_pdf():
    """Phase 5 Gate: PDF generator produces valid PDF bytes for all 5 document types."""
    spec_fintech = get_domain_pack("fintech")
    spec_health = get_domain_pack("healthcare")
    spec_ecom = get_domain_pack("ecommerce")

    types_and_specs = [
        ("bank_statement", spec_fintech),
        ("invoice", spec_ecom),
        ("lab_report", spec_health),
        ("discharge_summary", spec_health),
        ("insurance_claim", spec_health),
    ]

    for dtype, spec in types_and_specs:
        docs = DocumentEngine.generate_documents(doc_type=dtype, domain_spec=spec, count=1, seed=42)
        assert len(docs) == 1
        pdf_bytes = PDFDocumentRenderer.render_pdf(docs[0])
        assert isinstance(pdf_bytes, bytes)
        assert pdf_bytes.startswith(b"%PDF-")
        assert len(pdf_bytes) > 500
