import pytest
from httpx import ASGITransport, AsyncClient
from backend.app.main import app
from backend.app.domains.packs import get_domain_pack


@pytest.mark.asyncio
async def test_api_documents_generate():
    """Phase 6 Gate: POST /documents/generate returns structured documents."""
    spec = get_domain_pack("fintech")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/documents/generate",
            json={
                "doc_type": "bank_statement",
                "count": 2,
                "seed": 42,
                "spec": spec.model_dump()
            }
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["doc_type"] == "bank_statement"
        assert len(data["documents"]) == 2


@pytest.mark.asyncio
async def test_api_documents_pdf():
    """Phase 6 Gate: POST /documents/pdf returns valid binary PDF response."""
    spec = get_domain_pack("ecommerce")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First generate a doc
        gen_resp = await client.post(
            "/documents/generate",
            json={
                "doc_type": "invoice",
                "count": 1,
                "seed": 42,
                "spec": spec.model_dump()
            }
        )
        assert gen_resp.status_code == 200
        doc = gen_resp.json()["documents"][0]

        # Render PDF
        pdf_resp = await client.post("/documents/pdf", json={"document": doc})
        assert pdf_resp.status_code == 200
        assert pdf_resp.headers["content-type"] == "application/pdf"
        assert pdf_resp.content.startswith(b"%PDF-")


@pytest.mark.asyncio
async def test_api_quality_report():
    """Phase 6 & 7 Gate: POST /quality/report returns audit data."""
    spec = get_domain_pack("fintech")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/quality/report", json=spec.model_dump())
        assert resp.status_code == 200
        data = resp.json()
        assert "integrity" in data
        assert "fidelity" in data


@pytest.mark.asyncio
async def test_api_export_bundle():
    """Phase 6 & 7 Gate: POST /export/bundle returns comprehensive zip."""
    spec = get_domain_pack("ecommerce")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/export/bundle",
            json={
                "spec": spec.model_dump(),
                "doc_type": "invoice",
                "doc_count": 2
            }
        )
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/zip"
        assert len(resp.content) > 1000
