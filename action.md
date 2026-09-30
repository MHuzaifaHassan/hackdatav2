# Synthetic Data Platform — action.md

## Execution Progress (All Phases 0 - 7 Complete)

### Phase 0: Skeleton & Tooling
- [x] Project workspace structure initialized (`backend/app`, `backend/tests`, `backend/app/domains`, `data_out`)
- [x] Virtual environment `.venv` created and dependencies installed (`fastapi`, `pydantic`, `pandas`, `numpy`, `faker`, `jinja2`, `scipy`, `pytest`, `pytest-asyncio`, `reportlab`, `httpx`, `pyyaml`, `python-multipart`)
- [x] Backend core config (`backend/app/config.py`)
- [x] LLM provider interface & mock stub (`backend/app/llm/provider.py`, `backend/app/llm/prompts.py`)
- [x] FastAPI application entrypoint (`backend/app/main.py`) with `/health`, `/domains`, `/spec/infer`, `/generate/tabular`
- [x] Phase 0 Test Gate: `pytest backend/tests/test_health.py` passes, `/health` returns 200

### Phase 1: Spec Models + Tabular Engine
- [x] Pydantic Spec models (`backend/app/spec/models.py`): `DomainSpec`, `TableSpec`, `ColumnSpec`, `RelationSpec`, `DistributionSpec`, `PrivacySpec`, `EdgeCasesSpec`
- [x] Privacy Engine (`backend/app/engines/privacy.py`): Masking (e.g. `jo***@example.com`), SHA-256 Hashing, Differential Privacy Laplace/Gaussian noise
- [x] Edge Cases Injector (`backend/app/engines/edgecases.py`): Controlled null rates, numeric outliers (IQR), boundary dates, unicode/accented names, rare categories
- [x] Tabular Generator Engine (`backend/app/engines/tabular.py`):
  - Deterministic RNG seeding via `numpy.random.default_rng(seed)` & `faker.seed_instance(seed)`
  - Exact row count guarantee
  - Supported column generators: `id`, `int`, `float`, `category`, `date`, `datetime`, `person_name`, `email`, `phone`, `address`, `text_placeholder`, `boolean`
  - Continuous & discrete distributions: `uniform`, `normal`, `lognormal`, `exponential`, `poisson`, `binomial`, `beta`, `gamma`
- [x] Phase 1 Test Gate: `backend/tests/test_tabular_engine.py` passes 100% green

### Phase 2: AI Schema Inference (Prompt / Sample → Spec)
- [x] Schema inference engine (`backend/app/spec/infer.py`):
  - Natural-language prompt to `DomainSpec` conversion
  - CSV profiling & statistical inference (`infer_from_csv`)
  - Auto-repair validation loop with automatic YAML pack fallback
  - Built-in domain packs: `fintech.yaml`, `healthcare.yaml`, `ecommerce.yaml`, `hr.yaml`, `logistics.yaml`
- [x] Phase 2 Test Gate: `backend/tests/test_infer.py` passes 100% green

### Phase 3: Relational Engine
- [x] Topological sort table ordering based on dependency DAG (`backend/app/engines/relational.py`)
- [x] Foreign Key (FK) sampling & cardinalities (`1:1`, `1:N`, `N:N` junction tables, skewed power-law distributions)
- [x] Cross-table rules engine:
  - Date ordering: child dates $\ge$ parent dates
  - Zero orphan FK guarantee (100% relational integrity)
  - Primary key uniqueness across all tables
- [x] Phase 3 Test Gate: `pytest backend/tests/test_relational_engine.py` passes 100% green

### Phase 4: Realism Layer
- [x] Domain vocabularies for authentic text (`backend/app/engines/text_fill.py`):
  - Real merchants (Amazon, Starbucks, Uber, Walmart, Target, Shell...)
  - Real clinical diagnosis codes (ICD-10) and medications (Metformin, Lisinopril, Atorvastatin...)
  - Real products, SKU catalogs, HR job titles, logistics dispatch notes
- [x] Correlated columns:
  - Income $\leftrightarrow$ Account Balance positive correlation ($\rho > 0.30$)
- [x] Healthcare constraint validation (no male pregnancy, valid birth dates $\le$ today)
- [x] Phase 4 Test Gate: `pytest backend/tests/test_realism_layer.py` passes 100% green

### Phase 5: Document Generator (LangGraph)
- [x] 7-Node StateGraph Pipeline (`backend/app/documents/graph.py`):
  `parse_request` → `plan_document` → `gather_records` → `compute_numbers` → `narrate` → `validate` → `render`
- [x] 5 Grounded Document Types (`backend/app/documents/engine.py`):
  - Bank Statements (Opening Balance + Credits − Debits == Closing Balance, Running Balances on each row)
  - Tax Invoices (Subtotal + Tax == Grand Total to the exact cent)
  - Clinical Lab Reports (Physiological reference ranges, Out-of-range status flags)
  - Hospital Discharge Summaries (Monotonic admission/discharge dates, grounded medications)
  - Insurance Claims / EOB (Claimed Amount − Deductible − Coinsurance == Benefit Paid)
- [x] Direct PDF Rendering (`backend/app/documents/pdf.py`): ReportLab PDF engine with crisp vector layout, tables, running totals, and styling
- [x] Phase 5 Test Gate: `pytest backend/tests/test_document_generator.py` passes 100% green

### Phase 6: API + Modern Chat-Style UI
- [x] FastAPI REST API (`backend/app/main.py`):
  - `POST /spec/infer` & `POST /spec/infer-csv`
  - `POST /generate/tabular` & `POST /generate/relational`
  - `POST /documents/generate` & `POST /documents/pdf`
  - `POST /quality/report`
  - `POST /export/sql`, `POST /export/zip`, `POST /export/bundle`
- [x] Modern ChatGPT-Style Frontend (`frontend/src/App.jsx`, `frontend/src/index.css`):
  - Clean White & Light Green theme (`#059669`, `#ecfdf5`, `#10b981`)
  - Left navigation slider with 3 core feature modes: Tabular, Relational, Documents
  - Relational ER Diagram DAG visualizer with PK/FK badges
  - Live Paginated Data Browser with instant text search
  - Live Document Cards with deterministic math verification chips
  - One-click "📥 Download PDF" button for single documents
  - One-click "📦 Complete Bundle (ZIP)" export button (CSVs + SQL dump + JSON + Quality Report + PDFs)
  - Interactive "🔬 Quality Audit" Modal
  - Edge cases injector (null rate, outlier rate, unicode names) & Privacy suite (email masking, SHA-256 hashing)
- [x] Phase 6 Test Gate: `backend/tests/test_api_endpoints.py` passes 100% green

### Phase 7: Quality Report + Polish + Demo
- [x] Quality Assurance Report Generator (`backend/app/validation/report.py`):
  - Relational Integrity: 100% verified, 0 orphan violations
  - Statistical Fidelity: Invariant preservation, distribution statistics
  - Differential Privacy: Masking verification, duplicate checking
- [x] Complete Bundle Exporter (`backend/app/export/exporter.py`):
  - Packed into `${domain}_complete_bundle.zip` with table CSVs, `schema.sql`, `dataset.json`, `quality_report.json`, and PDF documents
- [x] 3 Executable Demo Scripts:
  - `demo_fintech.py`: Generates customers, accounts, transactions + reconciled bank statement PDF + ZIP bundle
  - `demo_healthcare.py`: Generates patients, visits, lab reports + clinical lab report PDF + ZIP bundle
  - `demo_ecommerce.py`: Generates users, products, orders + reconciled commercial tax invoice PDF + ZIP bundle
- [x] All 42/42 tests pass green (`.venv\Scripts\pytest backend/tests/ -v`)
- [x] Backend running on `http://127.0.0.1:8000`
- [x] Frontend running on `http://127.0.0.1:5173`
