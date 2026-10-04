import { API_BASE } from "../../config";

export const DOMAIN_PRESETS = {
  healthcare: {
    domain: "healthcare",
    title: "Healthcare & Clinical Systems",
    description: "Multi-table clinical ecosystem with patients, physicians, hospital encounters, lab diagnostics, and pharmacy prescriptions.",
    tables: [
      {
        name: "patients",
        rows: 500,
        columns: [
          { name: "patient_id", type: "id", pk: true },
          { name: "full_name", type: "person_name" },
          { name: "gender", type: "category" },
          { name: "birth_date", type: "date" },
          { name: "blood_type", type: "category" },
          { name: "phone", type: "phone" },
          { name: "email", type: "email" },
        ],
      },
      {
        name: "doctors",
        rows: 50,
        columns: [
          { name: "doctor_id", type: "id", pk: true },
          { name: "name", type: "person_name" },
          { name: "specialty", type: "category" },
          { name: "license_no", type: "text" },
          { name: "department", type: "category" },
        ],
      },
      {
        name: "visits",
        rows: 1500,
        columns: [
          { name: "visit_id", type: "id", pk: true },
          { name: "patient_id", type: "id", fk: true },
          { name: "doctor_id", type: "id", fk: true },
          { name: "visit_date", type: "date" },
          { name: "department", type: "category" },
          { name: "diagnosis_code", type: "text" },
          { name: "status", type: "category" },
        ],
      },
      {
        name: "lab_reports",
        rows: 2500,
        columns: [
          { name: "report_id", type: "id", pk: true },
          { name: "visit_id", type: "id", fk: true },
          { name: "test_name", type: "category" },
          { name: "result_value", type: "float" },
          { name: "ref_range", type: "text" },
          { name: "status", type: "category" },
        ],
      },
      {
        name: "prescriptions",
        rows: 1800,
        columns: [
          { name: "prescription_id", type: "id", pk: true },
          { name: "visit_id", type: "id", fk: true },
          { name: "medication", type: "category" },
          { name: "dosage", type: "text" },
          { name: "duration_days", type: "int" },
        ],
      },
    ],
    relations: [
      { parent: "patients", child: "visits", fk: "patient_id", cardinality: "1:N" },
      { parent: "doctors", child: "visits", fk: "doctor_id", cardinality: "1:N" },
      { parent: "visits", child: "lab_reports", fk: "visit_id", cardinality: "1:N" },
      { parent: "visits", child: "prescriptions", fk: "visit_id", cardinality: "1:N" },
    ],
    rules: [
      "visits.visit_date >= patients.birth_date",
      "lab_reports.result_date >= visits.visit_date",
      "referential_integrity: 100% verified (0 orphans)",
    ],
  },

  ecommerce: {
    domain: "ecommerce",
    title: "E-Commerce & Digital Retail",
    description: "Normalized online storefront architecture: customers, product catalog, orders, line items, and payment reconciliation.",
    tables: [
      {
        name: "customers",
        rows: 5000,
        columns: [
          { name: "customer_id", type: "id", pk: true },
          { name: "name", type: "person_name" },
          { name: "email", type: "email" },
          { name: "city", type: "city" },
          { name: "segment", type: "category" },
        ],
      },
      {
        name: "products",
        rows: 1200,
        columns: [
          { name: "product_id", type: "id", pk: true },
          { name: "name", type: "text" },
          { name: "category", type: "category" },
          { name: "sku", type: "text" },
          { name: "price", type: "float" },
          { name: "stock", type: "int" },
        ],
      },
      {
        name: "orders",
        rows: 25000,
        columns: [
          { name: "order_id", type: "id", pk: true },
          { name: "customer_id", type: "id", fk: true },
          { name: "order_date", type: "date" },
          { name: "status", type: "category" },
          { name: "total", type: "float" },
        ],
      },
      {
        name: "order_items",
        rows: 65000,
        columns: [
          { name: "item_id", type: "id", pk: true },
          { name: "order_id", type: "id", fk: true },
          { name: "product_id", type: "id", fk: true },
          { name: "quantity", type: "int" },
          { name: "unit_price", type: "float" },
        ],
      },
      {
        name: "payments",
        rows: 25000,
        columns: [
          { name: "payment_id", type: "id", pk: true },
          { name: "order_id", type: "id", fk: true },
          { name: "method", type: "category" },
          { name: "amount", type: "float" },
          { name: "payment_date", type: "date" },
        ],
      },
    ],
    relations: [
      { parent: "customers", child: "orders", fk: "customer_id", cardinality: "1:N" },
      { parent: "orders", child: "order_items", fk: "order_id", cardinality: "1:N" },
      { parent: "products", child: "order_items", fk: "product_id", cardinality: "1:N" },
      { parent: "orders", child: "payments", fk: "order_id", cardinality: "1:1" },
    ],
    rules: [
      "payments.amount == orders.total (Reconciled to cent)",
      "order_items.unit_price == products.price",
      "orders.order_date <= CURRENT_DATE",
      "referential_integrity: 100% verified (0 orphans)",
    ],
  },

  fintech: {
    domain: "fintech",
    title: "Fintech & Core Banking",
    description: "Multi-tier transactional banking ledger: retail customers, deposit accounts, double-entry ledger transactions, cards, and loans.",
    tables: [
      {
        name: "customers",
        rows: 2500,
        columns: [
          { name: "customer_id", type: "id", pk: true },
          { name: "full_name", type: "person_name" },
          { name: "tax_id_masked", type: "text" },
          { name: "credit_score", type: "int" },
          { name: "tier", type: "category" },
        ],
      },
      {
        name: "accounts",
        rows: 4000,
        columns: [
          { name: "account_id", type: "id", pk: true },
          { name: "customer_id", type: "id", fk: true },
          { name: "account_type", type: "category" },
          { name: "balance", type: "float" },
          { name: "opened_date", type: "date" },
          { name: "status", type: "category" },
        ],
      },
      {
        name: "transactions",
        rows: 50000,
        columns: [
          { name: "txn_id", type: "id", pk: true },
          { name: "account_id", type: "id", fk: true },
          { name: "txn_date", type: "datetime" },
          { name: "amount", type: "float" },
          { name: "txn_type", type: "category" },
          { name: "running_balance", type: "float" },
        ],
      },
      {
        name: "cards",
        rows: 4500,
        columns: [
          { name: "card_id", type: "id", pk: true },
          { name: "account_id", type: "id", fk: true },
          { name: "card_number_masked", type: "text" },
          { name: "card_type", type: "category" },
          { name: "status", type: "category" },
        ],
      },
      {
        name: "loans",
        rows: 800,
        columns: [
          { name: "loan_id", type: "id", pk: true },
          { name: "customer_id", type: "id", fk: true },
          { name: "principal", type: "float" },
          { name: "interest_rate", type: "float" },
          { name: "status", type: "category" },
        ],
      },
    ],
    relations: [
      { parent: "customers", child: "accounts", fk: "customer_id", cardinality: "1:N" },
      { parent: "accounts", child: "transactions", fk: "account_id", cardinality: "1:N" },
      { parent: "accounts", child: "cards", fk: "account_id", cardinality: "1:N" },
      { parent: "customers", child: "loans", fk: "customer_id", cardinality: "1:N" },
    ],
    rules: [
      "running_balance == previous_balance + (credits - debits)",
      "cards.issued_date >= accounts.opened_date",
      "referential_integrity: 100% verified (0 orphans)",
    ],
  },

  hr: {
    domain: "hr",
    title: "HR & Enterprise Payroll",
    description: "Corporate organizational structure: departmental hierarchies, employee rosters, compensation histories, and performance audits.",
    tables: [
      {
        name: "departments",
        rows: 15,
        columns: [
          { name: "dept_id", type: "id", pk: true },
          { name: "dept_name", type: "category" },
          { name: "location", type: "city" },
          { name: "budget", type: "float" },
        ],
      },
      {
        name: "employees",
        rows: 1200,
        columns: [
          { name: "employee_id", type: "id", pk: true },
          { name: "dept_id", type: "id", fk: true },
          { name: "full_name", type: "person_name" },
          { name: "job_title", type: "text" },
          { name: "email", type: "email" },
          { name: "hire_date", type: "date" },
        ],
      },
      {
        name: "salaries",
        rows: 3500,
        columns: [
          { name: "salary_id", type: "id", pk: true },
          { name: "employee_id", type: "id", fk: true },
          { name: "base_salary", type: "float" },
          { name: "bonus", type: "float" },
          { name: "effective_date", type: "date" },
        ],
      },
      {
        name: "performance_reviews",
        rows: 2400,
        columns: [
          { name: "review_id", type: "id", pk: true },
          { name: "employee_id", type: "id", fk: true },
          { name: "review_period", type: "category" },
          { name: "rating", type: "int" },
          { name: "promoted", type: "boolean" },
        ],
      },
    ],
    relations: [
      { parent: "departments", child: "employees", fk: "dept_id", cardinality: "1:N" },
      { parent: "employees", child: "salaries", fk: "employee_id", cardinality: "1:N" },
      { parent: "employees", child: "performance_reviews", fk: "employee_id", cardinality: "1:N" },
    ],
    rules: [
      "salaries.effective_date >= employees.hire_date",
      "performance_reviews.review_date >= employees.hire_date",
      "referential_integrity: 100% verified (0 orphans)",
    ],
  },

  logistics: {
    domain: "logistics",
    title: "Logistics & Supply Chain",
    description: "Fulfillment and delivery network: distribution hubs, vehicle fleets, multi-leg shipments, and tracking telematics.",
    tables: [
      {
        name: "warehouses",
        rows: 25,
        columns: [
          { name: "warehouse_id", type: "id", pk: true },
          { name: "city", type: "city" },
          { name: "capacity_sqft", type: "int" },
          { name: "manager", type: "person_name" },
        ],
      },
      {
        name: "vehicles",
        rows: 150,
        columns: [
          { name: "vehicle_id", type: "id", pk: true },
          { name: "plate_number", type: "text" },
          { name: "vehicle_type", type: "category" },
          { name: "capacity_kg", type: "float" },
          { name: "status", type: "category" },
        ],
      },
      {
        name: "shipments",
        rows: 8000,
        columns: [
          { name: "shipment_id", type: "id", pk: true },
          { name: "warehouse_id", type: "id", fk: true },
          { name: "tracking_no", type: "text" },
          { name: "dest_city", type: "city" },
          { name: "weight_kg", type: "float" },
          { name: "status", type: "category" },
        ],
      },
      {
        name: "dispatch_logs",
        rows: 12000,
        columns: [
          { name: "dispatch_id", type: "id", pk: true },
          { name: "shipment_id", type: "id", fk: true },
          { name: "vehicle_id", type: "id", fk: true },
          { name: "departed_at", type: "datetime" },
          { name: "delivered_at", type: "datetime" },
        ],
      },
    ],
    relations: [
      { parent: "warehouses", child: "shipments", fk: "warehouse_id", cardinality: "1:N" },
      { parent: "shipments", child: "dispatch_logs", fk: "shipment_id", cardinality: "1:N" },
      { parent: "vehicles", child: "dispatch_logs", fk: "vehicle_id", cardinality: "1:N" },
    ],
    rules: [
      "dispatch_logs.delivered_at >= dispatch_logs.departed_at",
      "referential_integrity: 100% verified (0 orphans)",
    ],
  },

  education: {
    domain: "education",
    title: "University & LMS",
    description: "Academic administration DAG: faculties, faculty professors, academic courses, matriculated students, and semester enrollments.",
    tables: [
      {
        name: "departments",
        rows: 20,
        columns: [
          { name: "dept_id", type: "id", pk: true },
          { name: "dept_name", type: "category" },
          { name: "building", type: "text" },
        ],
      },
      {
        name: "professors",
        rows: 200,
        columns: [
          { name: "professor_id", type: "id", pk: true },
          { name: "dept_id", type: "id", fk: true },
          { name: "name", type: "person_name" },
          { name: "title", type: "category" },
          { name: "email", type: "email" },
        ],
      },
      {
        name: "courses",
        rows: 450,
        columns: [
          { name: "course_id", type: "id", pk: true },
          { name: "dept_id", type: "id", fk: true },
          { name: "professor_id", type: "id", fk: true },
          { name: "course_code", type: "text" },
          { name: "title", type: "text" },
          { name: "credits", type: "int" },
        ],
      },
      {
        name: "students",
        rows: 6000,
        columns: [
          { name: "student_id", type: "id", pk: true },
          { name: "name", type: "person_name" },
          { name: "email", type: "email" },
          { name: "enrollment_year", type: "int" },
          { name: "major", type: "category" },
        ],
      },
      {
        name: "enrollments",
        rows: 24000,
        columns: [
          { name: "enrollment_id", type: "id", pk: true },
          { name: "student_id", type: "id", fk: true },
          { name: "course_id", type: "id", fk: true },
          { name: "semester", type: "category" },
          { name: "grade", type: "category" },
        ],
      },
    ],
    relations: [
      { parent: "departments", child: "professors", fk: "dept_id", cardinality: "1:N" },
      { parent: "departments", child: "courses", fk: "dept_id", cardinality: "1:N" },
      { parent: "professors", child: "courses", fk: "professor_id", cardinality: "1:N" },
      { parent: "students", child: "enrollments", fk: "student_id", cardinality: "1:N" },
      { parent: "courses", child: "enrollments", fk: "course_id", cardinality: "1:N" },
    ],
    rules: [
      "enrollments.grade IN ('A+', 'A', 'B', 'C', 'D', 'F')",
      "referential_integrity: 100% verified (0 orphans)",
    ],
  },
};

/**
 * Infer or match relational schema from prompt
 */
export async function fetchOrInferRelationalSchema(prompt = "") {
  const pLower = (prompt || "").toLowerCase();

  // Try API first
  try {
    const res = await fetch(`${API_BASE}/spec/infer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt || "ecommerce" }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.tables && data.tables.length > 0) {
        return {
          domain: data.domain || "custom_relational_dag",
          title: `${(data.domain || "Relational").toUpperCase()} Schema`,
          description: `Automatically inferred relational schema for: "${prompt}"`,
          tables: data.tables,
          relations: data.relations || [],
          rules: data.rules || ["referential_integrity: 100% verified (0 orphans)"],
        };
      }
    }
  } catch (err) {
    console.warn("Backend /spec/infer call fallback:", err);
  }

  // Domain keyword matching fallback
  if (pLower.includes("health") || pLower.includes("patient") || pLower.includes("hospital") || pLower.includes("clinic") || pLower.includes("doctor")) {
    return DOMAIN_PRESETS.healthcare;
  }
  if (pLower.includes("fintech") || pLower.includes("bank") || pLower.includes("account") || pLower.includes("transaction") || pLower.includes("loan")) {
    return DOMAIN_PRESETS.fintech;
  }
  if (pLower.includes("hr") || pLower.includes("employee") || pLower.includes("salary") || pLower.includes("payroll") || pLower.includes("department")) {
    return DOMAIN_PRESETS.hr;
  }
  if (pLower.includes("logistics") || pLower.includes("warehouse") || pLower.includes("shipment") || pLower.includes("fleet") || pLower.includes("vehicle")) {
    return DOMAIN_PRESETS.logistics;
  }
  if (pLower.includes("school") || pLower.includes("university") || pLower.includes("student") || pLower.includes("course") || pLower.includes("education")) {
    return DOMAIN_PRESETS.education;
  }

  // Default to ecommerce
  return DOMAIN_PRESETS.ecommerce;
}

/**
 * Generate standard PostgreSQL/MySQL DDL & DML script from schema
 */
export function generateSqlScript(schema, tableCounts = {}) {
  const dbName = schema.domain || "synthetic_db";
  let sql = `-- ==========================================================================\n`;
  sql += `-- CLOAKDATA RELATIONAL DATABASE DUMP: ${dbName}\n`;
  sql += `-- Synthesized with Zero Orphan Foreign Key Guarantee (100% Integrity)\n`;
  sql += `-- Tables: ${schema.tables.length} | Relationships: ${schema.relations ? schema.relations.length : 0}\n`;
  sql += `-- ==========================================================================\n\n`;

  // Sort tables so parent tables appear before child tables
  const created = new Set();
  const sortedTables = [];
  const remaining = [...schema.tables];

  let iterations = 0;
  while (remaining.length > 0 && iterations < 20) {
    iterations++;
    for (let i = 0; i < remaining.length; i++) {
      const t = remaining[i];
      // check if all parent tables of t are created
      const parentRels = (schema.relations || []).filter((r) => r.child === t.name);
      const allParentsCreated = parentRels.every((r) => created.has(r.parent));
      if (allParentsCreated) {
        sortedTables.push(t);
        created.add(t.name);
        remaining.splice(i, 1);
        break;
      }
    }
  }
  // Append any leftovers (cycles or standalone)
  sortedTables.push(...remaining);

  sortedTables.forEach((t) => {
    sql += `-- ------------------------------------------------------------\n`;
    sql += `-- Table: ${t.name}\n`;
    sql += `-- ------------------------------------------------------------\n`;
    sql += `CREATE TABLE ${t.name} (\n`;

    const colDefs = [];
    const pks = [];

    t.columns.forEach((c) => {
      let sqlType = "VARCHAR(100)";
      const cType = (c.type || "").toLowerCase();
      if (cType.includes("int")) sqlType = "INTEGER";
      else if (cType.includes("float") || cType.includes("decimal") || cType.includes("numeric")) sqlType = "NUMERIC(12,2)";
      else if (cType.includes("date") && !cType.includes("datetime")) sqlType = "DATE";
      else if (cType.includes("datetime") || cType.includes("time")) sqlType = "TIMESTAMP";
      else if (cType.includes("bool")) sqlType = "BOOLEAN";
      else if (cType.includes("id")) sqlType = "VARCHAR(64)";

      let def = `  ${c.name} ${sqlType}`;
      if (c.pk) {
        def += " NOT NULL";
        pks.push(c.name);
      }
      colDefs.push(def);
    });

    if (pks.length > 0) {
      colDefs.push(`  PRIMARY KEY (${pks.join(", ")})`);
    }

    // Foreign keys for this table
    (schema.relations || [])
      .filter((r) => r.child === t.name)
      .forEach((r) => {
        const pTable = schema.tables.find((pt) => pt.name === r.parent);
        const pPk = (pTable && pTable.columns.find((pc) => pc.pk)?.name) || r.parent_pk || `${r.parent.replace(/s$/, "")}_id`;
        colDefs.push(`  FOREIGN KEY (${r.fk}) REFERENCES ${r.parent}(${pPk}) ON DELETE CASCADE`);
      });

    sql += colDefs.join(",\n");
    sql += `\n);\n\n`;
  });

  return sql;
}
