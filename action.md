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

---

## Plan v2 Execution

### Initial Baseline Test Run
- Full pytest suite executed: 48/48 tests passed (100% green, 74.40s)
- Download validation test suite executed: All 3 live API acceptance tests passed
- Standalone demos (`demo_fintech.py`, `demo_healthcare.py`, `demo_ecommerce.py`) executed and verified
- Git repository initialized and baseline checkpoint committed (`c5703cf`)

### Phase 1A: Exact Quantity Guarantee — Code Audit Findings (Section 0.B.1)
1. **Child Counts in Relational Engine (`backend/app/engines/relational.py`)**:
   - In `generate_relational()` (lines 154-160), when `primary_rel.child_count` is defined, `counts_per_parent` samples from Poisson or Uniform distribution and sets `child_rows = len(fk_assignments)`. It never reconciles or scales the total child count to match the requested `table_spec.rows`. This causes child tables (e.g., transactions, lab reports, order items) to generate a random count differing from the user's requested quantity.
2. **Document Engine Account Clamping (`backend/app/documents/generator.py`)**:
   - In `_generate_bank_statements()` (line 48), the loop uses `for i in range(min(count, len(accounts))):`. If the user requests 50 bank statements but the accounts table only has 10 accounts, it generates only 10 statements and silently drops the remaining 40.
   - In `LangGraphDocumentGenerator` (`backend/app/documents/graph.py`), documents are generated once per attempt and there is no replacement loop or progress counter to accumulate valid documents until exact count N is reached.
3. **NLP Parser & Quantity Contract (`backend/app/spec/nlp_parser.py` & `models.py`)**:
   - `extract_query_size()` uses `\b(\d+)\b` indiscriminately; if the user says "5000 rows and 12 columns", it risks matching 12 or 5000 without separating rows vs columns.
   - There is no parsing for requested column counts ("12 columns") or required column lists ("these specific columns").
   - `DomainSpec` lacks a dedicated `quantities` contract schema (`QuantitiesSpec`).
4. **Unique Constraint and Impossible Quantity Handling (`backend/app/engines/tabular.py`)**:
   - When unique constraints are applied on categorical domains with finite cardinality (e.g. 5000 unique values from 300 possible values), the engine loops or repeats without throwing a structured `ImpossibleQuantityError` reporting `requested vs possible`.
5. **Over-generate and Trim**:
   - Tabular engine does not over-generate candidates (`ceil(N * 1.2)`) and trim to N when downstream filters, deduplication, or edge case nulls could impact exact row counts.
### Phase 1A: Exact Quantity Guarantee — Implementation & Test Gate PASSED
- [x] Created `backend/app/spec/errors.py`: Defined `ImpossibleQuantityError` (requested vs possible reporting).
- [x] Updated `backend/app/spec/models.py`: Added `ColumnsQuantitySpec`, `QuantitiesSpec`, and attached `quantities` to `DomainSpec`.
- [x] Updated `backend/app/spec/nlp_parser.py`:
  - Added `extract_quantities_contract(query, spec)` to parse row, column, and document quantities.
  - Implemented `_enforce_column_quantities()` to ensure required columns exist with exact names and table column count matches `exact_count`.
- [x] Updated `backend/app/engines/relational.py`:
  - Reconciled child count distributions (Poisson/Uniform) strictly to `table_spec.rows`.
  - Proportional scaling, fractional remainder distribution, and zero orphan FK guarantee maintained.
- [x] Updated `backend/app/engines/tabular.py`:
  - Added impossible quantity validation for categorical/boolean unique constraints.
  - Added post-generation trimming and exact row count assertion.
- [x] Updated `backend/app/documents/generator.py`:
  - Removed `min(count, len(accounts))` clamping in bank statement generation.
  - Sanitized null/NaN transaction amounts preventing balance calculation failures.
- [x] Updated `backend/app/documents/graph.py`:
  - Implemented document replacement loop guaranteeing exactly N valid documents and PDFs.
- [x] Added `backend/tests/test_quantity_guarantee.py`: 11 tests verifying all requirements in 0.B.5.
- [x] Phase 1A Test Gate: All 59 tests PASSED (100% green).
- [x] All 3 standalone demos (`demo_fintech.py`, `demo_healthcare.py`, `demo_ecommerce.py`) generate exact requested quantities and pass.
