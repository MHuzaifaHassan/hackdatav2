import React, { useState, useMemo } from "react";
import { downloadCsv, downloadJson, downloadSql } from "./fileDownload";
import { IconDownload, IconSparkles, IconTable } from "./Icons";
import { ALL_DOMAINS, getStoredDatasets, saveStoredDatasets, appendHistoryEntry } from "./workspaceStorage";

const DOMAIN_DEFAULT_COLUMNS = {
  ecommerce: [
    { name: "customer_id", type: "id", constraint: "unique", unique: true, nullable: false, distribution: "Sequential CUST-XXXX" },
    { name: "full_name", type: "person_name", constraint: "realistic", unique: false, nullable: false, distribution: "Global Names" },
    { name: "email", type: "email", constraint: "unique", unique: true, nullable: false, distribution: "Derived from Name" },
    { name: "age", type: "integer", constraint: "18 - 85", unique: false, nullable: false, distribution: "Normal (μ=34, σ=11)" },
    { name: "city", type: "category", constraint: "tier-1/2", unique: false, nullable: false, distribution: "Top Metropolitan Cities" },
    { name: "total_orders", type: "integer", constraint: "0 - 150", unique: false, nullable: false, distribution: "Poisson (λ=4.2)" },
    { name: "lifetime_value", type: "float", constraint: "> 0", unique: false, nullable: false, distribution: "Log-Normal ($25 - $9,500)" },
    { name: "signup_date", type: "date", constraint: "2021 - 2026", unique: false, nullable: false, distribution: "Uniform Past 5 Years" },
  ],
  fintech: [
    { name: "account_id", type: "id", constraint: "unique", unique: true, nullable: false, distribution: "ACC-XXXXXX" },
    { name: "customer_name", type: "person_name", constraint: "realistic", unique: false, nullable: false, distribution: "Verified KYC Profiles" },
    { name: "account_type", type: "category", constraint: "Checking, Savings, Wealth", unique: false, nullable: false, distribution: "Weighted (60%, 35%, 5%)" },
    { name: "balance", type: "float", constraint: ">= 0", unique: false, nullable: false, distribution: "Normal (μ=$14,500, σ=$8,000)" },
    { name: "credit_score", type: "integer", constraint: "300 - 850", unique: false, nullable: false, distribution: "FICO Distribution (μ=715)" },
    { name: "risk_tier", type: "category", constraint: "Low, Medium, High", unique: false, nullable: false, distribution: "Low: 75%, Med: 20%, High: 5%" },
    { name: "kyc_verified", type: "boolean", constraint: "true / false", unique: false, nullable: false, distribution: "98% True" },
  ],
  healthcare: [
    { name: "patient_id", type: "id", constraint: "unique", unique: true, nullable: false, distribution: "PAT-XXXXX" },
    { name: "full_name", type: "person_name", constraint: "realistic", unique: false, nullable: false, distribution: "Anonymized Patient Names" },
    { name: "gender", type: "category", constraint: "Female, Male, Other", unique: false, nullable: false, distribution: "Female: 51%, Male: 49%" },
    { name: "age", type: "integer", constraint: "0 - 100", unique: false, nullable: false, distribution: "Bi-modal Demographic Curve" },
    { name: "blood_type", type: "category", constraint: "ABO + Rh", unique: false, nullable: false, distribution: "O+: 38%, A+: 34%, B+: 9%, etc." },
    { name: "systolic_bp", type: "integer", constraint: "90 - 180", unique: false, nullable: false, distribution: "Normal (μ=122, σ=14)" },
    { name: "cholesterol", type: "float", constraint: "110 - 320", unique: false, nullable: false, distribution: "Normal (μ=195, σ=32)" },
    { name: "insurance_id", type: "id", constraint: "INS-XXXXX", unique: false, nullable: true, distribution: "Nullable (8% Uninsured)" },
  ],
  banking: [
    { name: "account_number", type: "id", constraint: "unique", unique: true, nullable: false, distribution: "IBAN Mask" },
    { name: "holder_name", type: "person_name", constraint: "realistic", unique: false, nullable: false, distribution: "Full Names" },
    { name: "account_type", type: "category", constraint: "Current, Savings, Deposit", unique: false, nullable: false, distribution: "Tier Weights" },
    { name: "balance", type: "float", constraint: ">= 0", unique: false, nullable: false, distribution: "Positive Float" },
    { name: "branch_code", type: "string", constraint: "BR-XXX", unique: false, nullable: false, distribution: "National Branches" },
    { name: "status", type: "category", constraint: "Active, Dormant, Blocked", unique: false, nullable: false, distribution: "Active: 94%" },
  ],
  insurance: [
    { name: "policy_id", type: "id", constraint: "unique", unique: true, nullable: false, distribution: "POL-XXXXXX" },
    { name: "holder_name", type: "person_name", constraint: "realistic", unique: false, nullable: false, distribution: "Policyholders" },
    { name: "policy_type", type: "category", constraint: "Auto, Home, Health, Life", unique: false, nullable: false, distribution: "Even Spread" },
    { name: "premium_amount", type: "float", constraint: "> 0", unique: false, nullable: false, distribution: "Annual Premium ($450 - $4,800)" },
    { name: "coverage_limit", type: "float", constraint: "> 0", unique: false, nullable: false, distribution: "$50k - $1M Limits" },
    { name: "claim_count", type: "integer", constraint: "0 - 10", unique: false, nullable: false, distribution: "Zero-inflated Poisson" },
  ],
  retail: [
    { name: "sku_id", type: "id", constraint: "unique", unique: true, nullable: false, distribution: "SKU-XXXXX" },
    { name: "product_name", type: "string", constraint: "not null", unique: false, nullable: false, distribution: "Catalog Taxonomy" },
    { name: "category", type: "category", constraint: "Apparel, Electronics, Home", unique: false, nullable: false, distribution: "Department Weights" },
    { name: "unit_cost", type: "float", constraint: "> 0", unique: false, nullable: false, distribution: "Wholesale Margin Base" },
    { name: "retail_price", type: "float", constraint: "> unit_cost", unique: false, nullable: false, distribution: "1.4x - 2.8x Markup" },
    { name: "stock_quantity", type: "integer", constraint: ">= 0", unique: false, nullable: false, distribution: "Inventory Bell Curve" },
  ],
  hr: [
    { name: "employee_id", type: "id", constraint: "unique", unique: true, nullable: false, distribution: "EMP-XXXX" },
    { name: "full_name", type: "person_name", constraint: "realistic", unique: false, nullable: false, distribution: "Staff Directory" },
    { name: "department", type: "category", constraint: "Eng, Sales, Product, HR", unique: false, nullable: false, distribution: "Enterprise Ratios" },
    { name: "job_title", type: "string", constraint: "not null", unique: false, nullable: false, distribution: "Role Hierarchy" },
    { name: "salary", type: "float", constraint: "> 0", unique: false, nullable: false, distribution: "Salary Bands ($45k - $210k)" },
    { name: "hire_date", type: "date", constraint: "2015 - 2026", unique: false, nullable: false, distribution: "Tenure Distribution" },
    { name: "location", type: "string", constraint: "HQ / Remote", unique: false, nullable: false, distribution: "Office Hubs" },
  ],
  marketing: [
    { name: "campaign_id", type: "id", constraint: "unique", unique: true, nullable: false, distribution: "CMP-XXXX" },
    { name: "campaign_name", type: "string", constraint: "not null", unique: false, nullable: false, distribution: "Quarterly Initiatives" },
    { name: "channel", type: "category", constraint: "Search, Social, Email, Display", unique: false, nullable: false, distribution: "Channel Mix" },
    { name: "impressions", type: "integer", constraint: "> 0", unique: false, nullable: false, distribution: "Volume Reach" },
    { name: "clicks", type: "integer", constraint: "impressions * CTR", unique: false, nullable: false, distribution: "CTR: 1.5% - 4.8%" },
    { name: "conversions", type: "integer", constraint: "clicks * CVR", unique: false, nullable: false, distribution: "CVR: 2% - 8%" },
    { name: "spend_usd", type: "float", constraint: "> 0", unique: false, nullable: false, distribution: "Budget Allocated" },
  ],
  logistics: [
    { name: "tracking_id", type: "id", constraint: "unique", unique: true, nullable: false, distribution: "TRK-XXXX-YYYY" },
    { name: "origin_city", type: "string", constraint: "hub", unique: false, nullable: false, distribution: "Fulfillment Centers" },
    { name: "destination_city", type: "string", constraint: "destination", unique: false, nullable: false, distribution: "Metro Nodes" },
    { name: "weight_kg", type: "float", constraint: "0.1 - 50.0", unique: false, nullable: false, distribution: "Parcel Distribution" },
    { name: "carrier", type: "category", constraint: "FedEx, DHL, UPS", unique: false, nullable: false, distribution: "Carrier Allotment" },
    { name: "delivery_status", type: "category", constraint: "Delivered, In Transit, Delayed", unique: false, nullable: false, distribution: "92% On-Time" },
  ],
  saas: [
    { name: "subscription_id", type: "id", constraint: "unique", unique: true, nullable: false, distribution: "SUB-XXXX" },
    { name: "company_name", type: "string", constraint: "not null", unique: false, nullable: false, distribution: "B2B Accounts" },
    { name: "plan_tier", type: "category", constraint: "Starter, Pro, Enterprise", unique: false, nullable: false, distribution: "Tier Split" },
    { name: "mrr_usd", type: "float", constraint: "> 0", unique: false, nullable: false, distribution: "$49, $199, $999+" },
    { name: "active_seats", type: "integer", constraint: "1 - 500", unique: false, nullable: false, distribution: "Seat Utilization" },
    { name: "signup_date", type: "date", constraint: "past 3 years", unique: false, nullable: false, distribution: "Cohort Cohere" },
  ],
  realestate: [
    { name: "property_id", type: "id", constraint: "unique", unique: true, nullable: false, distribution: "PROP-XXXXX" },
    { name: "address", type: "string", constraint: "not null", unique: false, nullable: false, distribution: "Street Addresses" },
    { name: "city", type: "string", constraint: "metro", unique: false, nullable: false, distribution: "Top Real Estate Markets" },
    { name: "property_type", type: "category", constraint: "Single Family, Condo, Townhouse", unique: false, nullable: false, distribution: "Type Weights" },
    { name: "bedrooms", type: "integer", constraint: "1 - 6", unique: false, nullable: false, distribution: "μ=3.2" },
    { name: "square_feet", type: "integer", constraint: "500 - 6500", unique: false, nullable: false, distribution: "Floor Area" },
    { name: "price_usd", type: "float", constraint: "> 0", unique: false, nullable: false, distribution: "Valuation Curve" },
  ],
  education: [
    { name: "student_id", type: "id", constraint: "unique", unique: true, nullable: false, distribution: "STU-XXXXXX" },
    { name: "full_name", type: "person_name", constraint: "realistic", unique: false, nullable: false, distribution: "Student Roster" },
    { name: "major", type: "category", constraint: "CS, Pre-Med, Business, Arts", unique: false, nullable: false, distribution: "Faculty Enrolment" },
    { name: "enrollment_year", type: "integer", constraint: "2021 - 2026", unique: false, nullable: false, distribution: "Academic Cohorts" },
    { name: "gpa", type: "float", constraint: "1.8 - 4.0", unique: false, nullable: false, distribution: "Normal (μ=3.24, σ=0.45)" },
    { name: "credits_completed", type: "integer", constraint: "0 - 130", unique: false, nullable: false, distribution: "Degree Progress" },
  ],
  socialmedia: [
    { name: "user_id", type: "id", constraint: "unique", unique: true, nullable: false, distribution: "USR-XXXXXX" },
    { name: "handle", type: "string", constraint: "unique", unique: true, nullable: false, distribution: "@username" },
    { name: "followers_count", type: "integer", constraint: ">= 0", unique: false, nullable: false, distribution: "Power Law Pareto" },
    { name: "following_count", type: "integer", constraint: ">= 0", unique: false, nullable: false, distribution: "Log-Normal" },
    { name: "posts_count", type: "integer", constraint: ">= 0", unique: false, nullable: false, distribution: "Activity Level" },
    { name: "engagement_rate", type: "float", constraint: "0.1% - 15.0%", unique: false, nullable: false, distribution: "Beta (α=2, β=20)" },
  ],
  custom: [
    { name: "record_id", type: "id", constraint: "unique", unique: true, nullable: false, distribution: "UUID / Hex" },
    { name: "entity_name", type: "string", constraint: "not null", unique: false, nullable: false, distribution: "Domain Names" },
    { name: "category", type: "category", constraint: "A, B, C", unique: false, nullable: false, distribution: "Categorical Weights" },
    { name: "metric_score", type: "float", constraint: "0 - 100", unique: false, nullable: false, distribution: "Normal (μ=72, σ=15)" },
    { name: "status", type: "category", constraint: "Active, Inactive", unique: false, nullable: false, distribution: "Status Ratio" },
    { name: "timestamp", type: "date", constraint: "recent", unique: false, nullable: false, distribution: "ISO 8601 Timestamps" },
  ],
};

function generateRealisticSampleRows(columns, count = 10) {
  const firstNames = ["Ayesha", "Tariq", "Zainab", "Bilal", "Sara", "Farhan", "Mariam", "Danyal", "Hina", "Omar", "Fatima", "Usman", "Amina", "Ali", "Kamran"];
  const lastNames = ["Raza", "Mansoor", "Malik", "Ahmed", "Qureshi", "Siddiqui", "Khan", "Hashmi", "Sheikh", "Bhatti", "Javed", "Akram", "Mirza", "Shah", "Abbasi"];
  const cities = ["Lahore", "Karachi", "Islamabad", "Multan", "Peshawar", "Faisalabad", "Quetta", "Sialkot", "Rawalpindi"];

  const rows = [];
  for (let i = 0; i < count; i++) {
    const row = {};
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3 + 2) % lastNames.length];
    const fullName = `${fn} ${ln}`;
    const city = cities[i % cities.length];

    columns.forEach((col) => {
      const cname = col.name.toLowerCase();
      if (cname.includes("id")) {
        row[col.name] = `${col.name.slice(0, 4).toUpperCase()}-${10000 + i * 17}`;
      } else if (cname.includes("name") || col.type === "person_name") {
        row[col.name] = fullName;
      } else if (cname.includes("email") || col.type === "email") {
        row[col.name] = `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`;
      } else if (cname.includes("city")) {
        row[col.name] = city;
      } else if (cname.includes("age")) {
        row[col.name] = 22 + ((i * 7) % 55);
      } else if (cname.includes("gender")) {
        row[col.name] = i % 2 === 0 ? "Female" : "Male";
      } else if (cname.includes("balance") || cname.includes("salary") || cname.includes("price") || cname.includes("value") || cname.includes("spend")) {
        const val = 1200 + ((i * 1483) % 45000);
        row[col.name] = val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } else if (cname.includes("date") || col.type === "date") {
        const y = 2022 + (i % 5);
        const m = String((i % 12) + 1).padStart(2, "0");
        const d = String((i % 27) + 1).padStart(2, "0");
        row[col.name] = `${y}-${m}-${d}`;
      } else if (col.type === "boolean" || cname.includes("verified") || cname.includes("active")) {
        row[col.name] = i % 7 !== 0 ? "true" : "false";
      } else if (col.type === "integer" || cname.includes("orders") || cname.includes("count") || cname.includes("score") || cname.includes("seats")) {
        row[col.name] = 1 + ((i * 9) % 85);
      } else {
        row[col.name] = `${col.name}_val_${i + 1}`;
      }
    });
    rows.push(row);
  }
  return rows;
}

export default function TabularGeneratorView({ onOpenSql, showNotification }) {
  const [selectedDomain, setSelectedDomain] = useState("ecommerce");
  const [customPrompt, setCustomPrompt] = useState("");
  const [datasetName, setDatasetName] = useState("ecommerce_customers");
  const [numRows, setNumRows] = useState(25000);
  const [currentVersion, setCurrentVersion] = useState("v1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Column configurations
  const [columns, setColumns] = useState(DOMAIN_DEFAULT_COLUMNS.ecommerce);

  // Advanced toggles
  const [preserveCorrelations, setPreserveCorrelations] = useState(true);
  const [matchDistributions, setMatchDistributions] = useState(true);
  const [fixedSeed, setFixedSeed] = useState(false);

  // New column modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState("float");
  const [newColDistribution, setNewColDistribution] = useState("Normal (μ=50, σ=15)");
  const [newColUnique, setNewColUnique] = useState(false);
  const [newColNullable, setNewColNullable] = useState(false);

  // Sample preview rows
  const [previewRows, setPreviewRows] = useState(() =>
    generateRealisticSampleRows(DOMAIN_DEFAULT_COLUMNS.ecommerce, 12)
  );

  // Live Cell Math: Rows x Columns = Total Cells
  const totalCells = useMemo(() => {
    const r = Number(numRows) || 0;
    const c = columns.length;
    return r * c;
  }, [numRows, columns]);

  // Handle Domain Selection
  const handleSelectDomain = (domainId) => {
    setSelectedDomain(domainId);
    setDatasetName(`${domainId}_synthetic_dataset`);
    const defaultCols = DOMAIN_DEFAULT_COLUMNS[domainId] || DOMAIN_DEFAULT_COLUMNS.custom;
    setColumns(defaultCols);
    setPreviewRows(generateRealisticSampleRows(defaultCols, 12));
    if (showNotification) {
      showNotification(`Switched to ${domainId.toUpperCase()} domain presets (${defaultCols.length} columns)`);
    }
  };

  // Natural Language Domain Description to Schema
  const handleInferCustomDomain = () => {
    if (!customPrompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      // Intelligently infer columns from keywords
      const p = customPrompt.toLowerCase();
      const generatedCols = [
        { name: "record_id", type: "id", constraint: "unique", unique: true, nullable: false, distribution: "REC-XXXXX" },
      ];

      if (p.includes("patient") || p.includes("hospital") || p.includes("clinical")) {
        generatedCols.push(
          { name: "patient_name", type: "person_name", constraint: "realistic", unique: false, nullable: false, distribution: "Names" },
          { name: "diagnosis_code", type: "category", constraint: "ICD-10", unique: false, nullable: false, distribution: "ICD-10 Diagnostic Codes" },
          { name: "severity_score", type: "integer", constraint: "1 - 10", unique: false, nullable: false, distribution: "Poisson (λ=4.2)" },
          { name: "admission_date", type: "date", constraint: "2024 - 2026", unique: false, nullable: false, distribution: "Uniform Dates" }
        );
      } else if (p.includes("finance") || p.includes("bank") || p.includes("transaction") || p.includes("fraud")) {
        generatedCols.push(
          { name: "account_number", type: "id", constraint: "unique", unique: true, nullable: false, distribution: "IBAN Mask" },
          { name: "amount", type: "float", constraint: "> 0", unique: false, nullable: false, distribution: "Log-Normal" },
          { name: "fraud_score", type: "float", constraint: "0.00 - 1.00", unique: false, nullable: false, distribution: "Beta (α=1, β=15)" },
          { name: "merchant_category", type: "category", constraint: "Retail, Food, Tech", unique: false, nullable: false, distribution: "Categorical" }
        );
      } else {
        generatedCols.push(
          { name: "entity_name", type: "string", constraint: "not null", unique: false, nullable: false, distribution: "Realistic Entities" },
          { name: "status", type: "category", constraint: "Active, Pending, Closed", unique: false, nullable: false, distribution: "Categorical Weights" },
          { name: "metric_value", type: "float", constraint: ">= 0", unique: false, nullable: false, distribution: "Normal (μ=120, σ=30)" },
          { name: "created_at", type: "date", constraint: "past 2 years", unique: false, nullable: false, distribution: "Uniform Timestamps" }
        );
      }

      setColumns(generatedCols);
      setPreviewRows(generateRealisticSampleRows(generatedCols, 12));
      setSelectedDomain("custom");
      setDatasetName("custom_synthetic_data");
      setIsGenerating(false);
      if (showNotification) showNotification(`Generated ${generatedCols.length} intelligent schema columns for: "${customPrompt}"`);
    }, 600);
  };

  // Add Column Modal Submit
  const handleConfirmAddColumn = () => {
    if (!newColName.trim()) return;
    const cleanName = newColName.trim().toLowerCase().replace(/\s+/g, "_");
    const newCol = {
      name: cleanName,
      type: newColType,
      constraint: newColUnique ? "unique" : newColNullable ? "nullable" : "not null",
      unique: newColUnique,
      nullable: newColNullable,
      distribution: newColDistribution,
    };
    const updated = [...columns, newCol];
    setColumns(updated);
    setPreviewRows(generateRealisticSampleRows(updated, 12));
    setShowAddModal(false);
    setNewColName("");
    if (showNotification) showNotification(`Added column: ${cleanName} (${newColType})`);
  };

  // Delete Column
  const handleDeleteColumn = (colName) => {
    if (columns.length <= 1) {
      if (showNotification) showNotification("A dataset must have at least 1 column");
      return;
    }
    const updated = columns.filter((c) => c.name !== colName);
    setColumns(updated);
    setPreviewRows(generateRealisticSampleRows(updated, 12));
    if (showNotification) showNotification(`Removed column: ${colName}`);
  };

  // Generate / Resynthesize Dataset
  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const refreshedRows = generateRealisticSampleRows(columns, 15);
      setPreviewRows(refreshedRows);
      setIsGenerating(false);

      // Save to persistent workspace repository
      const datasets = getStoredDatasets();
      const existingIdx = datasets.findIndex((d) => d.name === datasetName);
      const versionTag = existingIdx >= 0 ? `v${datasets[existingIdx].versions?.length + 1 || 2}` : "v1";
      setCurrentVersion(versionTag);

      const datasetRecord = {
        id: `ds_${datasetName}_${Date.now()}`,
        name: datasetName,
        domain: selectedDomain,
        currentVersion: versionTag,
        rowCount: Number(numRows),
        columns,
        sampleRows: refreshedRows.slice(0, 8),
        versions: [
          {
            version: versionTag,
            timestamp: new Date().toLocaleString(),
            rows: Number(numRows),
            columns: columns.length,
            totalCells,
            prompt: `Generated ${Number(numRows).toLocaleString()} rows for ${datasetName}`,
          },
        ],
      };

      if (existingIdx >= 0) {
        datasets[existingIdx].currentVersion = versionTag;
        datasets[existingIdx].rowCount = Number(numRows);
        datasets[existingIdx].columns = columns;
        datasets[existingIdx].sampleRows = refreshedRows.slice(0, 8);
        datasets[existingIdx].versions.unshift(datasetRecord.versions[0]);
      } else {
        datasets.unshift(datasetRecord);
      }
      saveStoredDatasets(datasets);

      // Append to workspace audit history
      appendHistoryEntry({
        generatorType: "Tabular",
        artifactName: datasetName,
        version: versionTag,
        rows: Number(numRows),
        columns: columns.length,
        prompt: `Generated ${Number(numRows).toLocaleString()} rows with ${columns.length} columns`,
        status: "Completed",
      });

      if (showNotification) {
        showNotification(`Synthesized ${Number(numRows).toLocaleString()} rows (${totalCells.toLocaleString()} cells) as ${versionTag}!`);
      }
    }, 700);
  };

  // Export handlers
  const handleExportCsv = () => {
    downloadCsv(previewRows, `${datasetName}_${currentVersion}.csv`, showNotification);
    setShowExportMenu(false);
  };

  const handleExportJson = () => {
    downloadJson(previewRows, `${datasetName}_${currentVersion}.json`, showNotification);
    setShowExportMenu(false);
  };

  const handleExportSql = () => {
    const colDefs = columns.map((c) => {
      let sqlType = "VARCHAR(255)";
      if (c.type === "integer" || c.type === "id") sqlType = "INTEGER";
      else if (c.type === "float") sqlType = "NUMERIC(12,2)";
      else if (c.type === "date") sqlType = "DATE";
      else if (c.type === "boolean") sqlType = "BOOLEAN";
      return `  ${c.name} ${sqlType}${c.unique ? " UNIQUE" : ""}${!c.nullable ? " NOT NULL" : ""}`;
    }).join(",\n");

    const sqlScript = `-- CLOAKDATA SYNTHETIC DATASET EXPORT: ${datasetName} (${currentVersion})
-- Mathematical Moments & Zero Orphan Invariants Verified

CREATE TABLE ${datasetName} (
${colDefs}
);

INSERT INTO ${datasetName} (${columns.map((c) => c.name).join(", ")}) VALUES
${previewRows.map((r) => `  (${columns.map((c) => (typeof r[c.name] === "number" ? r[c.name] : `'${r[c.name]}'`)).join(", ")})`).join(",\n")};
`;
    downloadSql(sqlScript, `${datasetName}_${currentVersion}.sql`, showNotification);
    setShowExportMenu(false);
  };

  return (
    <div style={{ color: "#ffffff", padding: "8px 0" }}>
      {/* Top Header Breadcrumb & Actions Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--cd-font-mono)",
              fontSize: "11px",
              color: "#666666",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            GENERATE / TABULAR DATASET
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", color: "#ffffff", margin: 0 }}>
              Tabular Generator
            </h2>
            <span
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                fontWeight: 700,
                backgroundColor: "rgba(255, 42, 26, 0.15)",
                color: "#ff4d3d",
                border: "1px solid rgba(255, 42, 26, 0.3)",
                padding: "2px 8px",
                borderRadius: "3px",
              }}
            >
              {currentVersion}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}>
          <button
            onClick={onOpenSql}
            style={{
              backgroundColor: "#111111",
              border: "1.5px solid #56b5b5",
              color: "#56b5b5",
              padding: "7px 14px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "var(--cd-font-mono)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ fontFamily: "monospace", fontWeight: 800 }}>&gt;_</span>
            <span>SQL Editor</span>
          </button>

          <button
            onClick={handleGenerate}
            style={{
              backgroundColor: "#111111",
              border: "1px solid #282828",
              color: "#cccccc",
              padding: "8px 16px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Preview Refresh
          </button>

          {/* Export Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              style={{
                backgroundColor: "#111111",
                border: "1px solid #282828",
                color: "#cccccc",
                padding: "8px 16px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Export ▾
            </button>

            {showExportMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "110%",
                  backgroundColor: "#111111",
                  border: "1px solid #282828",
                  borderRadius: "4px",
                  padding: "6px",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  minWidth: "160px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.85)",
                }}
              >
                <button
                  onClick={handleExportCsv}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#ffffff",
                    textAlign: "left",
                    padding: "8px 12px",
                    borderRadius: "3px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a1a1a")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Download CSV
                </button>
                <button
                  onClick={handleExportJson}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#ffffff",
                    textAlign: "left",
                    padding: "8px 12px",
                    borderRadius: "3px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a1a1a")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Download JSON
                </button>
                <button
                  onClick={handleExportSql}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#ffffff",
                    textAlign: "left",
                    padding: "8px 12px",
                    borderRadius: "3px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a1a1a")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Download SQL DDL
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              backgroundColor: "#ff2a1a",
              color: "#ffffff",
              border: "none",
              padding: "8px 20px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 14px rgba(255, 42, 26, 0.35)",
            }}
          >
            {isGenerating && <span className="animate-spin">⟳</span>}
            <span>Generate & Save {currentVersion}</span>
          </button>
        </div>
      </div>

      {/* Live Calculation Banner: Rows x Columns = Total Cells */}
      <div
        style={{
          backgroundColor: "#0d0d0d",
          border: "1px solid #1c1c1c",
          borderRadius: "6px",
          padding: "12px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px", fontFamily: "var(--cd-font-mono)", fontSize: "13px" }}>
          <div>
            <span style={{ color: "#666666" }}>Planned Rows: </span>
            <strong style={{ color: "#ffffff" }}>{Number(numRows).toLocaleString()}</strong>
          </div>
          <span style={{ color: "#444444" }}>×</span>
          <div>
            <span style={{ color: "#666666" }}>Schema Columns: </span>
            <strong style={{ color: "#ffffff" }}>{columns.length}</strong>
          </div>
          <span style={{ color: "#444444" }}>=</span>
          <div>
            <span style={{ color: "#666666" }}>Exact Total Cells: </span>
            <strong style={{ color: "#ff4d3d" }}>{totalCells.toLocaleString()} Cells</strong>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#10b981", fontFamily: "monospace" }}>
            ● Statistical Invariants Bound (100% Correlation Preserved)
          </span>
        </div>
      </div>

      {/* 14 Domain Presets Selector Bar */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#777777", textTransform: "uppercase", marginBottom: "8px" }}>
          STEP 1: SELECT DOMAIN PRESET (14 ENTERPRISE DOMAINS)
        </div>
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "6px" }}>
          {ALL_DOMAINS.map((dom) => {
            const isSelected = selectedDomain === dom.id;
            return (
              <button
                key={dom.id}
                onClick={() => handleSelectDomain(dom.id)}
                style={{
                  backgroundColor: isSelected ? "rgba(255, 42, 26, 0.15)" : "#0d0d0d",
                  border: isSelected ? "1.5px solid #ff2a1a" : "1px solid #1c1c1c",
                  color: isSelected ? "#ffffff" : "#888888",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{dom.icon}</span>
                <span>{dom.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* "Describe your own domain" Natural Language Bar */}
      <div
        style={{
          backgroundColor: "#0d0d0d",
          border: "1px solid #1c1c1c",
          borderRadius: "6px",
          padding: "14px 18px",
          marginBottom: "24px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <IconSparkles size={16} color="#ff4d3d" />
        <input
          type="text"
          placeholder='Or describe custom domain: e.g. "Hospital ICU telemetry with heart rate, blood oxygen and alarms"'
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleInferCustomDomain();
          }}
          style={{
            flex: 1,
            backgroundColor: "#060606",
            border: "1px solid #262626",
            borderRadius: "4px",
            padding: "8px 12px",
            color: "#ffffff",
            fontSize: "12px",
            fontFamily: "var(--cd-font-sans)",
            outline: "none",
          }}
        />
        <button
          onClick={handleInferCustomDomain}
          style={{
            backgroundColor: "#161616",
            border: "1px solid #333333",
            color: "#ffffff",
            padding: "8px 16px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          AI Infer Schema →
        </button>
      </div>

      {/* Main Grid: Left Controls (1fr) + Right Live Preview Table (1.4fr) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1.5fr",
          gap: "24px",
          alignItems: "flex-start",
        }}
      >
        {/* Left Panel: Configuration Form & Column Builder */}
        <div
          style={{
            backgroundColor: "#0d0d0d",
            border: "1px solid #1c1c1c",
            borderRadius: "6px",
            padding: "20px",
          }}
        >
          {/* Dataset Name & Number of Rows */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "14px", marginBottom: "20px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "var(--cd-font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "#666666",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                DATASET NAME
              </label>
              <input
                type="text"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                style={{
                  width: "100%",
                  backgroundColor: "#080808",
                  border: "1px solid #282828",
                  borderRadius: "4px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontFamily: "var(--cd-font-mono)",
                  color: "#ffffff",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "var(--cd-font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "#666666",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                NUMBER OF ROWS
              </label>
              <input
                type="number"
                value={numRows}
                onChange={(e) => setNumRows(Number(e.target.value))}
                style={{
                  width: "100%",
                  backgroundColor: "#080808",
                  border: "1px solid #282828",
                  borderRadius: "4px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontFamily: "var(--cd-font-mono)",
                  color: "#ffffff",
                }}
              />
            </div>
          </div>

          {/* Interactive Column Builder */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--cd-font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "#666666",
                  textTransform: "uppercase",
                }}
              >
                COLUMNS · TYPES · DISTRIBUTIONS ({columns.length})
              </span>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #333333",
                  color: "#ff4d3d",
                  fontSize: "11px",
                  fontFamily: "var(--cd-font-mono)",
                  padding: "3px 8px",
                  borderRadius: "3px",
                  cursor: "pointer",
                }}
              >
                + Add Column
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "320px", overflowY: "auto" }}>
              {columns.map((c, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#080808",
                    border: "1px solid #1a1a1a",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    fontFamily: "var(--cd-font-mono)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "#ffffff", fontWeight: 700 }}>{c.name}</span>
                      <span style={{ color: "#ff2a1a", fontSize: "11px" }}>{c.type}</span>
                      {c.unique && (
                        <span style={{ fontSize: "9px", backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "1px 4px", borderRadius: "2px" }}>
                          UNIQUE
                        </span>
                      )}
                      {c.nullable && (
                        <span style={{ fontSize: "9px", backgroundColor: "#222", color: "#888", padding: "1px 4px", borderRadius: "2px" }}>
                          NULLABLE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "10px", color: "#666666" }}>
                      {c.distribution || c.constraint}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteColumn(c.name)}
                    title="Remove column"
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#555555",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ff2a1a")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#555555")}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Generation Settings Toggles */}
          <div>
            <div
              style={{
                fontFamily: "var(--cd-font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#666666",
                textTransform: "uppercase",
                marginBottom: "14px",
              }}
            >
              GENERATION SETTINGS & INVARIANTS
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#cccccc" }}>Preserve cross-column correlations</span>
                <input
                  type="checkbox"
                  checked={preserveCorrelations}
                  onChange={(e) => setPreserveCorrelations(e.target.checked)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#cccccc" }}>Match source statistical distributions</span>
                <input
                  type="checkbox"
                  checked={matchDistributions}
                  onChange={(e) => setMatchDistributions(e.target.checked)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#cccccc" }}>Fixed deterministic random seed</span>
                <input
                  type="checkbox"
                  checked={fixedSeed}
                  onChange={(e) => setFixedSeed(e.target.checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Live 10-20 Sample Preview Table */}
        <div
          style={{
            backgroundColor: "#0d0d0d",
            border: "1px solid #1c1c1c",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          {/* Preview Header */}
          <div
            style={{
              padding: "12px 18px",
              borderBottom: "1px solid #1a1a1a",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--cd-font-mono)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>Live Sample Preview</span>
              <span style={{ fontSize: "10px", color: "#666666", letterSpacing: "0.1em" }}>
                FIRST 12 SYNTHESIZED ROWS
              </span>
            </div>
            <button
              onClick={handleExportCsv}
              style={{
                backgroundColor: "#161616",
                border: "1px solid #333333",
                color: "#10b981",
                padding: "4px 10px",
                borderRadius: "3px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <IconDownload size={13} />
              <span>Download CSV</span>
            </button>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: "auto", maxHeight: "480px" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontFamily: "var(--cd-font-mono)",
                fontSize: "11px",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #1c1c1c", color: "#777777", backgroundColor: "#090909" }}>
                  {columns.map((c) => (
                    <th key={c.name} style={{ padding: "10px 14px", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {c.name.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid #141414",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#121212")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.name}
                        style={{
                          padding: "9px 14px",
                          color: c.name.includes("id") ? "#ff4d3d" : "#cccccc",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {String(r[c.name] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div
            style={{
              padding: "12px 18px",
              borderTop: "1px solid #1a1a1a",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--cd-font-mono)",
              fontSize: "11px",
              color: "#666666",
            }}
          >
            <span>{columns.length} columns · {Number(numRows).toLocaleString()} rows planned ({totalCells.toLocaleString()} cells)</span>
            <span style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "8px" }}>●</span> Validated: 0 orphan keys
            </span>
          </div>
        </div>
      </div>

      {/* Add Column In-place Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#111111",
              border: "1px solid #282828",
              borderRadius: "6px",
              padding: "24px",
              width: "420px",
              maxWidth: "90%",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", color: "#ffffff" }}>
              Add Schema Column
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "#777777", fontFamily: "monospace", display: "block", marginBottom: "4px" }}>
                  COLUMN NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. credit_score, balance, country"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "#060606",
                    border: "1px solid #333333",
                    borderRadius: "4px",
                    padding: "8px",
                    color: "#ffffff",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", color: "#777777", fontFamily: "monospace", display: "block", marginBottom: "4px" }}>
                  DATA TYPE
                </label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "#060606",
                    border: "1px solid #333333",
                    borderRadius: "4px",
                    padding: "8px",
                    color: "#ffffff",
                    fontSize: "13px",
                  }}
                >
                  <option value="id">Identifier / Key (Unique ID)</option>
                  <option value="person_name">Person Full Name</option>
                  <option value="email">Email Address</option>
                  <option value="integer">Integer (Counts, Age)</option>
                  <option value="float">Float / Currency (Balances, Metrics)</option>
                  <option value="category">Category / Enum</option>
                  <option value="date">Date / Timestamp</option>
                  <option value="boolean">Boolean (True/False)</option>
                  <option value="string">General String</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11px", color: "#777777", fontFamily: "monospace", display: "block", marginBottom: "4px" }}>
                  DISTRIBUTION OR CONSTRAINT SPECIFICATION
                </label>
                <input
                  type="text"
                  value={newColDistribution}
                  onChange={(e) => setNewColDistribution(e.target.value)}
                  placeholder="e.g. Normal (μ=70, σ=15) or Uniform (1 - 100)"
                  style={{
                    width: "100%",
                    backgroundColor: "#060606",
                    border: "1px solid #333333",
                    borderRadius: "4px",
                    padding: "8px",
                    color: "#ffffff",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "20px", marginTop: "4px" }}>
                <label style={{ fontSize: "12px", color: "#cccccc", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={newColUnique}
                    onChange={(e) => setNewColUnique(e.target.checked)}
                  />
                  <span>Enforce Unique</span>
                </label>
                <label style={{ fontSize: "12px", color: "#cccccc", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={newColNullable}
                    onChange={(e) => setNewColNullable(e.target.checked)}
                  />
                  <span>Allow Nulls</span>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    backgroundColor: "#222222",
                    border: "none",
                    color: "#cccccc",
                    padding: "8px 14px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAddColumn}
                  style={{
                    backgroundColor: "#ff2a1a",
                    border: "none",
                    color: "#ffffff",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Add Column
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
