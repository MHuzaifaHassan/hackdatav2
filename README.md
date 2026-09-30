# Synthetic Data Platform

An enterprise-grade, privacy-safe Synthetic Data & Grounded Document Generation Platform. The platform translates natural-language domain descriptions into mathematically verified tabular datasets, relational DAG schemas with 100% foreign key integrity, and realistic PDF documents.

---

## 🌟 Key Capabilities

1. **Tabular Engine**:
   - Deterministic row generation using seed-based RNG (`seed=42`).
   - Statistical distributions: Normal, Lognormal, Poisson, Exponential, Binomial, Uniform, Beta, Gamma.
   - Privacy suite: PII email masking, SHA-256 secret hashing, Differential Privacy noise.
   - Edge case injection: Controlled null rates, numeric outliers, boundary dates, and unicode names.

2. **Relational Engine**:
   - Topological dependency ordering (DAG) for parent-to-child entity generation.
   - Cardinalities: `1:1`, `1:N`, and `N:N` junction tables.
   - Cross-table invariant preservation: **0 orphan foreign keys**, child dates $\ge$ parent dates, and income $\leftrightarrow$ balance correlation ($\rho > 0.30$).

3. **Grounded Document Generator (LangGraph)**:
   - 7-Node StateGraph workflow: `parse_request` $\to$ `plan_document` $\to$ `gather_records` $\to$ `compute_numbers` $\to$ `narrate` $\to$ `validate` $\to$ `render`.
   - Reconciled document types:
     - **Bank Statements**: Opening Balance + Credits − Debits == Closing Balance with verified running balances.
     - **Commercial Tax Invoices**: Subtotal + Tax Rate == Grand Total exact to the cent.
     - **Clinical Lab Reports**: Verified physiological reference ranges with out-of-range flags.
     - **Hospital Discharge Summaries**: Monotonic admission/discharge dates and grounded clinical diagnoses.
     - **Insurance Claims (EOB)**: Deductibles, coinsurance, and net benefit reconciliation.
   - Vector PDF generation with ReportLab.

4. **ChatGPT-Style Frontend**:
   - Clean White & Light Green aesthetic (`#059669`, `#ecfdf5`).
   - Left slider sidebar switching between **Tabular**, **Relational**, and **Documents** modes.
   - Interactive Relational ER Diagram DAG visualizer.
   - Paginated data browser with instant text filter.
   - One-click **📥 Download PDF** for single documents.
   - One-click **📦 Complete Bundle (.ZIP)** containing CSVs, SQL DDL+DML dump, JSON, Quality Report, and generated PDFs.
   - One-click **🔬 Quality Audit** modal displaying relational integrity, statistical fidelity, and differential privacy checks.

---

## 🚀 Quick Start (Localhost)

### 1. Prerequisites
- Python 3.11+
- Node.js 18+

### 2. Backend Setup & Run
```powershell
# From project root
.venv\Scripts\activate
pip install -r requirements.txt

# Start FastAPI backend (Port 8000)
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Backend API will be live at: `http://127.0.0.1:8000`  
Interactive Swagger docs: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup & Run
```powershell
cd frontend
npm install
npm run dev
```
Frontend Web UI will be live at: `http://127.0.0.1:5173`

---

## 🧪 Automated Test Suite

Run the full pytest suite (all 42 test gates):
```powershell
.venv\Scripts\pytest backend/tests/ -v
```
All 42 tests cover:
- Health & domain listing endpoints
- Deterministic seeding, exact row counts, null/outlier tolerances
- AI schema inference & YAML domain pack auto-repair fallbacks
- Relational topological sorting, zero orphan FKs, cross-table date ordering
- Realism layer (merchants, ICD-10 codes, income/balance correlations)
- LangGraph document engine & mathematical reconciliation
- ReportLab PDF binary generation
- Quality Audit Report generator & Bundle ZIP packager

---

## 📦 Standalone Demo Scripts

Three end-to-end demo scripts are provided. They generate relational tables, assert invariants, create sample PDFs, and package full ZIP bundles into `data_out/`:

```powershell
# 1. Fintech Banking Demo (Customers, Accounts, Transactions + Bank Statement PDF)
python demo_fintech.py

# 2. Healthcare Clinic Demo (Patients, Visits, Lab Reports + Clinical Lab PDF)
python demo_healthcare.py

# 3. E-Commerce Store Demo (Users, Products, Orders + Tax Invoice PDF)
python demo_ecommerce.py
```
Output files will be saved in `data_out/`:
- `data_out/fintech_bank_statement.pdf` & `data_out/fintech_bundle.zip`
- `data_out/healthcare_lab_report.pdf` & `data_out/healthcare_bundle.zip`
- `data_out/ecommerce_tax_invoice.pdf` & `data_out/ecommerce_bundle.zip`

---

## 📁 Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── config.py             # App configurations & settings
│   │   ├── main.py               # FastAPI routes & endpoints
│   │   ├── documents/            # LangGraph document generator & PDF renderer
│   │   │   ├── engine.py         # 5 document schema builders & math reconciliation
│   │   │   ├── graph.py          # 7-node LangGraph pipeline
│   │   │   └── pdf.py            # ReportLab vector PDF renderer
│   │   ├── domains/              # Built-in fallback domain packs (YAML)
│   │   │   ├── fintech.yaml
│   │   │   ├── healthcare.yaml
│   │   │   ├── ecommerce.yaml
│   │   │   ├── hr.yaml
│   │   │   └── logistics.yaml
│   │   ├── engines/              # Deterministic data generation engines
│   │   │   ├── tabular.py        # Single table generator & distributions
│   │   │   ├── relational.py     # Multi-table DAG & foreign key sampler
│   │   │   ├── privacy.py        # Masking, hashing, differential privacy
│   │   │   ├── edgecases.py      # Nulls, outliers, unicode names
│   │   │   └── text_fill.py      # Domain text & merchant dictionaries
│   │   ├── export/               # CSV, SQL, JSON, and ZIP bundle exporters
│   │   ├── llm/                  # LLM provider interface & mock fallback
│   │   ├── spec/                 # Pydantic specification models & AI inference
│   │   └── validation/           # Quality Audit report generator & validators
│   └── tests/                    # 42 unit and integration tests
├── frontend/                     # React + Vite application
│   ├── src/
│   │   ├── App.jsx               # ChatGPT-style conversation UI
│   │   ├── index.css             # Clean White & Light Green theme tokens
│   │   └── main.jsx
│   └── package.json
├── demo_fintech.py               # Executable fintech demo
├── demo_healthcare.py            # Executable healthcare demo
├── demo_ecommerce.py             # Executable e-commerce demo
├── plan.md                       # Comprehensive system architecture & phase gates
├── action.md                     # Phase progress tracking checklist
└── requirements.txt              # Python dependencies
```
