# Synthetic Data Platform — plan.md

## 1. Goal
User describes what they need in plain language (e.g. "fintech app with customers, accounts, transactions, 5k rows" or "hospital with patients, visits, lab reports"). The platform produces:

1. **Tabular data** — statistically realistic single tables (CSV / JSON)
2. **Relational data** — multiple tables with PK/FK integrity, cardinalities, cross-table consistency (CSV zip / SQL dump / SQLite)
3. **Documents** — PDF + JSON docs (invoices, bank statements, lab reports, discharge summaries, insurance claims), built with **LangGraph**, consistent with the relational data

Any domain: fintech, healthcare, e-commerce, HR, logistics, education, telecom, insurance, etc.

## 2. Core design principle (most important)
| Layer | Who does it | Why |
|---|---|---|
| Schema / rules / vocabulary / edge-case ideas | **LLM** | needs understanding |
| Rows, IDs, dates, amounts, FK links, totals, running balances | **Deterministic code** (numpy/Faker/own engine) | guarantees consistency, reproducible via seed |
| Free-text (notes, descriptions, narratives) | **LLM in batches**, grounded on a row's real values | realistic but consistent |
| Validation | **Code** | reconcile totals, FK, ranges; LLM output is never trusted blindly |

Rule: LLM never generates 10,000 rows directly. It generates a **Domain Spec** (JSON), the engine executes it.

## 3. Tech stack
- **Backend:** Python 3.11+, FastAPI, Pydantic v2, pandas, numpy, Faker, Jinja2, WeasyPrint (or reportlab) for PDF, SQLite/SQLAlchemy for dump
- **AI:** LangGraph + LangChain, LLM provider behind one interface (`LLM_PROVIDER=gemini|openai|anthropic`), structured output via Pydantic
- **Frontend:** React + Vite + Tailwind (3 tabs: Tabular / Relational / Documents; config panel + live preview + export)
- **Tests:** pytest, hypothesis (optional), Playwright or manual checklist for UI
- **Fallback:** if no API key / LLM fails, use built-in **domain packs** (YAML) so demo never dies

## 4. Folder structure
```
synth-platform/
  plan.md  action.md
  backend/
    app/
      main.py                 # FastAPI
      config.py
      llm/  provider.py  prompts.py
      spec/ models.py         # DomainSpec, TableSpec, ColumnSpec, RelationSpec
      spec/ infer.py          # prompt/sample -> DomainSpec (LLM)
      engines/
        tabular.py  relational.py  privacy.py  edgecases.py  text_fill.py
      domains/  fintech.yaml healthcare.yaml ecommerce.yaml hr.yaml ...
      documents/
        graph.py              # LangGraph
        nodes/ (plan, gather, compute, narrate, validate, render)
        templates/ invoice.html bank_statement.html lab_report.html discharge.html claim.html
      validation/ integrity.py fidelity.py reconcile.py report.py
      export/ csv_json.py sql_dump.py pdf.py zipper.py
    tests/
  frontend/
  data_out/
```

## 5. Domain Spec (the contract between AI and engine)
```json
{
  "domain": "fintech",
  "locale": "en_US", "currency": "USD", "seed": 42,
  "tables": [{
    "name": "customers", "rows": 1000,
    "columns": [
      {"name":"customer_id","type":"id","pk":true},
      {"name":"full_name","type":"person_name"},
      {"name":"email","type":"email","derive_from":"full_name"},
      {"name":"signup_date","type":"date","range":["2022-01-01","2025-08-01"]},
      {"name":"segment","type":"category","values":{"retail":0.7,"premium":0.25,"business":0.05}},
      {"name":"income","type":"float","dist":"lognormal","params":{"mean":10.5,"sigma":0.5},"null_rate":0.02}
    ]}],
  "relations": [{"parent":"customers","child":"accounts","fk":"customer_id","cardinality":"1:N","child_count":{"dist":"poisson","lambda":1.6,"min":1}}],
  "rules": ["transactions.date >= accounts.opened_date", "orders.total == sum(order_items.qty*unit_price)"],
  "edge_cases": {"null_rate":0.02,"outlier_rate":0.01,"duplicates":false}
}
```

## 6. LangGraph — document generator
```
parse_request → plan_document → gather_records → compute_numbers → narrate → validate ─ok→ render → done
                                                       ▲                       │fail (max 3)
                                                       └───────────────────────┘
```
- **parse_request:** doc type, count, region/locale, filters ("last 90 days, balance > 500")
- **plan_document:** picks template + which tables/records are needed
- **gather_records:** pulls real rows from the generated relational data (customer, account, transactions / patient, visit, labs) — this gives cross-document consistency
- **compute_numbers:** code only — subtotal, tax, total, running balance, reference-range flags
- **narrate:** LLM writes descriptions/notes/clinical narrative **only from provided facts**, structured output, no new numbers
- **validate:** recompute totals, check dates, names match records, banned "real-looking" data (use example.com, reserved phone ranges); on fail loop back with error message
- **render:** Jinja2 → HTML → PDF + JSON sidecar

## 7. Phases (each phase ends with a TEST GATE — do not move on until green)

### Phase 0 — Skeleton & tooling
Repo, venv, FastAPI hello, config, LLM provider stub, pytest running, CI-like `make test`.
**Gate:** `pytest` passes, `/health` returns 200.

### Phase 1 — Spec models + Tabular engine
Pydantic spec models; column generators (id, int, float, category, date, name, email, phone, address, text-placeholder, boolean); distributions; seed; null/outlier rates; derived columns; privacy (mask/hash/noise).
**Gate:** same seed ⇒ identical output; row count exact; null rate within ±1%; category proportions within ±3%; dates in range; emails unique when required.

### Phase 2 — AI schema inference (prompt / sample → Spec)
`infer.py`: (a) from natural-language prompt, (b) from uploaded CSV sample (infer types + distributions in code, LLM names/relationships), (c) from domain pack. Structured output + repair loop.
**Gate:** 5 prompts (fintech, healthcare, ecommerce, HR, logistics) each yield a valid DomainSpec that generates data without error; invalid LLM JSON is auto-repaired or falls back to pack.

### Phase 3 — Relational engine
Topological table order, FK sampling, cardinalities 1:1 / 1:N / N:N (junction), child-count distributions, cross-table rules (date ordering, `orders.total == Σ items`), skewed FK (some customers have many orders).
**Gate:** 0 orphan FKs; PK unique; order totals reconcile 100%; child dates ≥ parent dates; cardinality stats match spec.

### Phase 4 — Realism layer (domain packs + LLM text fill + edge cases)
Domain packs: fintech, healthcare, ecommerce, HR (merchant lists, ICD-10 / CPT samples, drug names, realistic amount ranges, correlated columns like age↔diagnosis, income↔balance). LLM text fill in batches with row context (cached by hash). Edge-case injector (nulls, outliers, unicode names, boundary dates, rare categories).
**Gate:** no `lorem ipsum`/"Test User 1"; correlation checks (e.g. income vs balance ρ > 0.3); healthcare: no impossible combos (male + pregnancy, age<0); edge-case rate ≈ configured.

### Phase 5 — Document generator (LangGraph)
Implement graph + templates: Invoice, Bank statement (+ query mode), Lab report, Discharge summary, Insurance claim/EOB. Region templates (date format, currency, tax label: VAT / GST / Sales tax). Bulk mode.
**Gate:** every invoice: Σ lines + tax == total (to the cent); every statement: opening + credits − debits == closing, running balance correct on each row; document names/IDs exist in relational data; validator retry works (inject a deliberate error test); PDFs open and contain expected text.

### Phase 6 — API + UI
Endpoints: `POST /spec/infer`, `POST /generate/tabular|relational|documents`, `GET /preview`, `GET /export/{job}`. Frontend workspace: left nav (Tabular / Relational / Documents), center live preview, right config (rows, seed, locale & currency, privacy rules, edge-case sliders), Export button, prompt box "describe your data". Async jobs for big runs.
**Gate:** API tests pass; UI manual checklist (below) passes end to end for all 3 modes.

### Phase 7 — Quality report + polish + demo
Validation report (integrity ✓, fidelity stats vs sample, privacy check: no real-record leakage), export bundle (zip: CSV/JSON + SQL dump + PDFs + report), README, 3 demo scripts (fintech / healthcare / ecommerce), error handling, loading states.
**Gate:** fresh clone → setup → demo runs in < 5 min; full test suite green.
