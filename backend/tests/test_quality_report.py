import pytest
from backend.app.domains.packs import get_domain_pack
from backend.app.engines.relational import RelationalEngine
from backend.app.validation.report import QualityReportGenerator


def test_quality_report_fintech_integrity_and_fidelity():
    """Phase 7 Gate: Quality report checks for fintech dataset."""
    spec = get_domain_pack("fintech")
    engine = RelationalEngine()
    data = engine.generate_relational(spec, seed=42)

    report = QualityReportGenerator.generate_report(data, spec)
    assert report["domain"] == "fintech"
    assert report["overall_status"] in ("PASSED", "WARNING")
    assert "integrity" in report
    assert "fidelity" in report
    assert "privacy" in report

    # Integrity metrics
    integrity = report["integrity"]
    assert integrity["orphan_foreign_keys"] == 0
    assert integrity["primary_key_uniqueness_rate"] == 1.0


def test_quality_report_healthcare_integrity():
    """Phase 7 Gate: Quality report checks for healthcare dataset."""
    spec = get_domain_pack("healthcare")
    engine = RelationalEngine()
    data = engine.generate_relational(spec, seed=42)

    report = QualityReportGenerator.generate_report(data, spec)
    assert report["domain"] == "healthcare"
    assert report["integrity"]["orphan_foreign_keys"] == 0
    assert report["integrity"]["primary_key_uniqueness_rate"] == 1.0
    assert "patients" in report["tables_audited"]


def test_quality_report_ecommerce_order_totals():
    """Phase 7 Gate: Quality report checks for ecommerce dataset."""
    spec = get_domain_pack("ecommerce")
    engine = RelationalEngine()
    data = engine.generate_relational(spec, seed=42)

    report = QualityReportGenerator.generate_report(data, spec)
    assert report["domain"] == "ecommerce"
    assert report["integrity"]["orphan_foreign_keys"] == 0
