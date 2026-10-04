import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    """Phase 0 Gate: /health returns 200 and system status."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "app_name" in data
    assert "version" in data
    assert "llm_provider" in data


@pytest.mark.asyncio
async def test_domains_list_endpoint():
    """Phase 0 / Phase 1: Verify domain pack listing endpoint."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/domains")
    assert response.status_code == 200
    domains = response.json()
    assert isinstance(domains, list)
    assert "fintech" in domains
    assert "healthcare" in domains


@pytest.mark.asyncio
async def test_generate_tabular_api_json_and_csv():
    """Verify POST /generate/tabular endpoint for both JSON and CSV downloads."""
    transport = ASGITransport(app=app)
    spec_payload = {
        "domain": "ecommerce",
        "locale": "en_US",
        "currency": "USD",
        "seed": 42,
        "tables": [
            {
                "name": "products",
                "rows": 10,
                "columns": [
                    {"name": "product_id", "type": "id", "pk": True, "prefix": "PRD-"},
                    {"name": "title", "type": "text-placeholder"},
                    {"name": "price", "type": "float", "min": 10.0, "max": 100.0}
                ]
            }
        ]
    }

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Test JSON response
        resp_json = await ac.post("/generate/tabular?format=json", json=spec_payload)
        assert resp_json.status_code == 200
        data = resp_json.json()
        assert data["table"] == "products"
        assert data["rows"] == 10
        assert len(data["data"]) == 10
        assert data["data"][0]["product_id"].startswith("PRD-")

        # Test CSV response
        resp_csv = await ac.post("/generate/tabular?format=csv", json=spec_payload)
        assert resp_csv.status_code == 200
        assert "text/csv" in resp_csv.headers["content-type"]
        csv_text = resp_csv.text
        assert "product_id,title,price" in csv_text
        assert len(csv_text.strip().split("\n")) == 11  # header + 10 rows


@pytest.mark.asyncio
async def test_infer_api_endpoint():
    """Verify POST /spec/infer endpoint returns valid DomainSpec."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/spec/infer", json={"prompt": "fintech banking transactions"})
        assert resp.status_code == 200
        spec = resp.json()
        assert "domain" in spec
        assert len(spec["tables"]) >= 1
