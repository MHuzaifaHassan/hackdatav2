/**
 * Centralized Persistent Workspace Storage Manager for CLOAKDATA
 * Manages datasets, versions (v1, v2, v3), relational schemas, documents, history, and projects.
 */

const STORAGE_KEY_DATASETS = "cloakdata_workspace_datasets";
const STORAGE_KEY_RELATIONAL = "cloakdata_workspace_relational";
const STORAGE_KEY_DOCUMENTS = "cloakdata_workspace_documents";
const STORAGE_KEY_HISTORY = "cloakdata_workspace_history";
const STORAGE_KEY_PROJECTS = "cloakdata_workspace_projects";

// Default initial datasets
const DEFAULT_DATASETS = [
  {
    id: "ds_ecommerce_customers",
    name: "ecommerce_customers",
    domain: "ecommerce",
    currentVersion: "v2",
    versions: [
      {
        version: "v1",
        timestamp: "2026-09-30 08:15:00",
        rows: 10000,
        columns: 7,
        totalCells: 70000,
        prompt: "Generate 10,000 e-commerce customer records",
      },
      {
        version: "v2",
        timestamp: "2026-09-30 09:10:00",
        rows: 25000,
        columns: 9,
        totalCells: 225000,
        prompt: "Add lifetime value and total orders, scale to 25,000 rows",
      },
    ],
    columns: [
      { name: "customer_id", type: "id", pk: true, unique: true, nullable: false, config: "CUST-XXXX" },
      { name: "full_name", type: "person_name", unique: false, nullable: false, config: "Global Realistic" },
      { name: "email", type: "email", unique: true, nullable: false, config: "Unique Verified" },
      { name: "age", type: "int", unique: false, nullable: false, config: "Normal (mean: 34, min: 18, max: 75)" },
      { name: "gender", type: "category", unique: false, nullable: false, config: "Male: 48%, Female: 50%, Other: 2%" },
      { name: "country", type: "country", unique: false, nullable: false, config: "Top 20 Markets" },
      { name: "signup_date", type: "date", unique: false, nullable: false, config: "2020 - 2026" },
      { name: "total_orders", type: "int", unique: false, nullable: false, config: "Poisson (lambda: 4.2)" },
      { name: "lifetime_value", type: "float", unique: false, nullable: false, config: "Decimal (min: 15.0, max: 8500.0)" },
    ],
    rowCount: 25000,
    sampleRows: [
      { customer_id: "CUST-1001", full_name: "Ayesha Raza", email: "ayesha.raza@example.com", age: 29, gender: "Female", country: "United States", signup_date: "2023-04-12", total_orders: 8, lifetime_value: 1240.50 },
      { customer_id: "CUST-1002", full_name: "Tariq Mansoor", email: "tariq.m@example.com", age: 42, gender: "Male", country: "United Kingdom", signup_date: "2022-11-05", total_orders: 14, lifetime_value: 2890.00 },
      { customer_id: "CUST-1003", full_name: "Zainab Malik", email: "zainab.malik@example.com", age: 31, gender: "Female", country: "Canada", signup_date: "2024-01-18", total_orders: 3, lifetime_value: 410.20 },
      { customer_id: "CUST-1004", full_name: "Bilal Ahmed", email: "bilal.ahmed@example.com", age: 26, gender: "Male", country: "Germany", signup_date: "2023-08-22", total_orders: 6, lifetime_value: 890.00 },
      { customer_id: "CUST-1005", full_name: "Sara Qureshi", email: "sara.q@example.com", age: 38, gender: "Female", country: "Australia", signup_date: "2021-06-30", total_orders: 21, lifetime_value: 4650.00 },
    ],
  },
  {
    id: "ds_clinical_patients",
    name: "clinical_patients",
    domain: "healthcare",
    currentVersion: "v1",
    versions: [
      {
        version: "v1",
        timestamp: "2026-09-30 08:40:00",
        rows: 5000,
        columns: 7,
        totalCells: 35000,
        prompt: "Generate 5,000 healthcare patients with blood type and clinical vitals",
      },
    ],
    columns: [
      { name: "patient_id", type: "id", pk: true, unique: true, nullable: false, config: "PAT-XXXXX" },
      { name: "full_name", type: "person_name", unique: false, nullable: false, config: "Realistic Names" },
      { name: "gender", type: "category", unique: false, nullable: false, config: "Female: 51%, Male: 49%" },
      { name: "birth_date", type: "date", unique: false, nullable: false, config: "1940 - 2015" },
      { name: "blood_type", type: "category", unique: false, nullable: false, config: "O+, A+, B+, AB+, O-, A-, B-, AB-" },
      { name: "phone", type: "phone", unique: false, nullable: true, config: "E.164 Standard" },
      { name: "email", type: "email", unique: true, nullable: false, config: "Derived from Name" },
    ],
    rowCount: 5000,
    sampleRows: [
      { patient_id: "PAT-00001", full_name: "Allison Hill", gender: "Female", birth_date: "1967-11-01", blood_type: "A+", phone: "+1-702-555-3130", email: "allison.hill@example.com" },
      { patient_id: "PAT-00002", full_name: "Noah Rhodes", gender: "Male", birth_date: "1982-04-15", blood_type: "O+", phone: "+1-312-555-3244", email: "noah.rhodes@example.com" },
      { patient_id: "PAT-00003", full_name: "Angie Henderson", gender: "Female", birth_date: "1974-10-05", blood_type: "B+", phone: "+1-303-555-6140", email: "angie.h@example.com" },
      { patient_id: "PAT-00004", full_name: "Daniel Wagner", gender: "Male", birth_date: "1960-03-16", blood_type: "A+", phone: "+1-702-555-4745", email: "daniel.wagner@example.com" },
      { patient_id: "PAT-00005", full_name: "Cristian Santos", gender: "Male", birth_date: "1998-01-29", blood_type: "O+", phone: "+1-415-555-1443", email: "cristian.s@example.com" },
    ],
  },
];

// Default initial relational schemas
const DEFAULT_RELATIONAL_SCHEMAS = [
  {
    id: "rel_fintech_banking",
    name: "fintech_core_banking",
    domain: "fintech",
    description: "Multi-tier transactional banking DAG with zero orphan foreign keys",
    tablesCount: 5,
    relationsCount: 4,
    totalRecords: 157300,
    tables: [
      { name: "customers", rows: 10000, pks: ["customer_id"], fks: [] },
      { name: "accounts", rows: 15000, pks: ["account_id"], fks: ["customer_id"] },
      { name: "transactions", rows: 100000, pks: ["txn_id"], fks: ["account_id"] },
      { name: "cards", rows: 12000, pks: ["card_id"], fks: ["account_id"] },
      { name: "loans", rows: 5000, pks: ["loan_id"], fks: ["customer_id"] },
    ],
    relations: [
      { parent: "customers", child: "accounts", fk: "customer_id", cardinality: "1:N" },
      { parent: "accounts", child: "transactions", fk: "account_id", cardinality: "1:N" },
      { parent: "accounts", child: "cards", fk: "account_id", cardinality: "1:N" },
      { parent: "customers", child: "loans", fk: "customer_id", cardinality: "1:N" },
    ],
  },
  {
    id: "rel_healthcare_clinic",
    name: "healthcare_clinic_dag",
    domain: "healthcare",
    description: "Clinical encounters, physician appointments, and diagnostic lab reports",
    tablesCount: 5,
    relationsCount: 4,
    totalRecords: 6350,
    tables: [
      { name: "patients", rows: 500, pks: ["patient_id"], fks: [] },
      { name: "doctors", rows: 50, pks: ["doctor_id"], fks: [] },
      { name: "visits", rows: 1500, pks: ["visit_id"], fks: ["patient_id", "doctor_id"] },
      { name: "lab_reports", rows: 2500, pks: ["report_id"], fks: ["visit_id"] },
      { name: "prescriptions", rows: 1800, pks: ["prescription_id"], fks: ["visit_id"] },
    ],
    relations: [
      { parent: "patients", child: "visits", fk: "patient_id", cardinality: "1:N" },
      { parent: "doctors", child: "visits", fk: "doctor_id", cardinality: "1:N" },
      { parent: "visits", child: "lab_reports", fk: "visit_id", cardinality: "1:N" },
      { parent: "visits", child: "prescriptions", fk: "visit_id", cardinality: "1:N" },
    ],
  },
];

// Default initial generated documents
const DEFAULT_DOCUMENTS = [
  {
    id: "doc_tax_invoices",
    title: "Commercial Tax Invoices (Batch #104)",
    type: "Tax Invoice",
    count: 500,
    sourceDataset: "ecommerce_customers",
    timestamp: "2026-09-30 08:30:00",
    formats: ["PDF", "HTML", "JSON"],
    reconciled: true,
    sample: {
      invoiceId: "INV-2026-8842",
      customer: "Ayesha Raza",
      total: 1240.50,
      subtotal: 1127.73,
      tax: 112.77,
      status: "PAID",
    },
  },
  {
    id: "doc_bank_statements",
    title: "Monthly Checking Statements",
    type: "Bank Statement",
    count: 1000,
    sourceDataset: "fintech_core_banking",
    timestamp: "2026-09-30 07:50:00",
    formats: ["PDF", "JSON"],
    reconciled: true,
    sample: {
      accountNumber: "ACCT-984210",
      customer: "Tariq Mansoor",
      openingBalance: 45000.0,
      closingBalance: 52400.0,
      reconciledDiff: 0.0,
    },
  },
  {
    id: "doc_clinical_lab_reports",
    title: "Biomarker & Lipid Panel Reports",
    type: "Clinical Lab Report",
    count: 250,
    sourceDataset: "clinical_patients",
    timestamp: "2026-09-30 06:45:00",
    formats: ["PDF", "JSON"],
    reconciled: true,
    sample: {
      reportId: "LAB-2026-4412",
      patient: "Allison Hill",
      testName: "Lipid Panel",
      status: "NORMAL",
    },
  },
];

// Default history entries
const DEFAULT_HISTORY = [
  {
    id: "hist_01",
    timestamp: "2026-09-30 09:10:00",
    prompt: "Generate 25,000 realistic e-commerce customer records with lifetime value and orders",
    generatorType: "Tabular",
    artifactName: "ecommerce_customers",
    version: "v2",
    rows: 25000,
    columns: 9,
    status: "Completed",
  },
  {
    id: "hist_02",
    timestamp: "2026-09-30 08:40:00",
    prompt: "Synthesize relational healthcare clinic schema with 0 orphan foreign keys",
    generatorType: "Relational",
    artifactName: "healthcare_clinic_dag",
    version: "v1",
    rows: 6350,
    columns: 28,
    status: "Completed",
  },
  {
    id: "hist_03",
    timestamp: "2026-09-30 08:30:00",
    prompt: "Generate 500 reconciled commercial tax invoices for top customers",
    generatorType: "Document",
    artifactName: "Commercial Tax Invoices (Batch #104)",
    version: "v1",
    rows: 500,
    columns: 14,
    status: "Completed",
  },
];

export const ALL_DOMAINS = [
  { id: "fintech", label: "FinTech", icon: "💳", desc: "Digital banking, payments, credit scores, fraud alerts" },
  { id: "ecommerce", label: "E-Commerce", icon: "🛒", desc: "Customer profiles, product catalogs, carts, orders, payments" },
  { id: "healthcare", label: "Healthcare", icon: "🏥", desc: "Patient EHR, physician encounters, clinical labs, vitals" },
  { id: "banking", label: "Banking", icon: "🏦", desc: "Checking/savings accounts, double-entry ledgers, statements" },
  { id: "insurance", label: "Insurance", icon: "🛡️", desc: "Policyholders, underwriting tiers, claim EOBs, premiums" },
  { id: "retail", label: "Retail", icon: "🛍️", desc: "Brick-and-mortar POS transactions, SKUs, inventory replenishment" },
  { id: "hr", label: "HR & Payroll", icon: "👥", desc: "Employee records, departments, compensation, performance" },
  { id: "marketing", label: "Marketing", icon: "📈", desc: "Lead attribution, campaign CTRs, conversion funnels" },
  { id: "logistics", label: "Logistics", icon: "🚚", desc: "Fleet telematics, warehouses, multi-leg shipments, dispatch" },
  { id: "saas", label: "SaaS", icon: "⚡", desc: "Subscription tiers, MRR/ARR, tenant workspaces, seat usage" },
  { id: "realestate", label: "Real Estate", icon: "🏢", desc: "Property listings, mortgages, appraisals, lease agreements" },
  { id: "education", label: "Education / LMS", icon: "🎓", desc: "University students, professors, courses, enrollments, GPAs" },
  { id: "socialmedia", label: "Social Media", icon: "💬", desc: "User profiles, followers, engagement metrics, posts" },
  { id: "custom", label: "Custom Domain", icon: "✨", desc: "Describe any industry or bespoke schema in natural language" },
];

/**
 * Storage helpers with fallback
 */
export function getStoredDatasets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DATASETS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_DATASETS;
}

export function saveStoredDatasets(datasets) {
  try {
    localStorage.setItem(STORAGE_KEY_DATASETS, JSON.stringify(datasets));
  } catch (e) {}
}

export function getStoredRelationalSchemas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RELATIONAL);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_RELATIONAL_SCHEMAS;
}

export function saveStoredRelationalSchemas(schemas) {
  try {
    localStorage.setItem(STORAGE_KEY_RELATIONAL, JSON.stringify(schemas));
  } catch (e) {}
}

export function getStoredDocuments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DOCUMENTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_DOCUMENTS;
}

export function saveStoredDocuments(docs) {
  try {
    localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(docs));
  } catch (e) {}
}

export function getStoredHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_HISTORY;
}

export function appendHistoryEntry(entry) {
  const current = getStoredHistory();
  const updated = [
    {
      id: `hist_${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      ...entry,
    },
    ...current,
  ].slice(0, 50); // keep last 50
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}
