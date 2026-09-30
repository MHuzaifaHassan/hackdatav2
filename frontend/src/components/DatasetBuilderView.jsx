import React, { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

const COLUMN_TYPES = [
  { value: "id", label: "Primary Key / ID" },
  { value: "person_name", label: "Person Name" },
  { value: "email", label: "Email Address" },
  { value: "phone", label: "Phone Number (Locale Aware)" },
  { value: "city", label: "City (Locale Aware)" },
  { value: "address", label: "Physical Address" },
  { value: "int", label: "Integer (Uniform/Poisson)" },
  { value: "float", label: "Float / Numeric Currency" },
  { value: "category", label: "Category / Enum" },
  { value: "date", label: "Calendar Date" },
  { value: "boolean", label: "Boolean Flag" },
  { value: "text_placeholder", label: "Descriptive Narrative Text" },
];

export default function DatasetBuilderView({ onGenerateDataset, showNotification }) {
  const [domainName, setDomainName] = useState("custom_store");
  const [locale, setLocale] = useState("en_PK");
  const [currency, setCurrency] = useState("PKR");
  const [seed, setSeed] = useState(42);

  // Tables State
  const [tables, setTables] = useState([
    {
      name: "customers",
      rows: 50,
      columns: [
        { name: "customer_id", type: "id", pk: true, unique: true, nullable: false },
        { name: "full_name", type: "person_name", pk: false, unique: false, nullable: false },
        { name: "email", type: "email", pk: false, unique: true, nullable: false },
        { name: "phone", type: "phone", pk: false, unique: false, nullable: false },
        { name: "city", type: "city", pk: false, unique: false, nullable: false },
      ]
    },
    {
      name: "orders",
      rows: 100,
      columns: [
        { name: "order_id", type: "id", pk: true, unique: true, nullable: false },
        { name: "customer_id", type: "id", pk: false, unique: false, nullable: false },
        { name: "order_amount", type: "float", pk: false, min: 500, max: 25000, dist: "normal", nullable: false },
        { name: "order_status", type: "category", pk: false, values: { "COMPLETED": 0.7, "PENDING": 0.2, "CANCELLED": 0.1 } },
        { name: "order_date", type: "date", pk: false }
      ]
    }
  ]);

  // Relations State
  const [relations, setRelations] = useState([
    { parent: "customers", child: "orders", fk: "customer_id", cardinality: "1:N", ratio: 2.0 }
  ]);

  const [activeTableIdx, setActiveTableIdx] = useState(0);

  // Plain-English column prompt input for active table
  const [columnPrompt, setColumnPrompt] = useState("");
  const [parsingColumn, setParsingColumn] = useState(false);

  // New Column Quick Add Form
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState("float");
  const [newColMin, setNewColMin] = useState("");
  const [newColMax, setNewColMax] = useState("");
  const [newColUnique, setNewColUnique] = useState(false);
  const [newColNullable, setNewColNullable] = useState(false);
  const [newColCategories, setNewColCategories] = useState("");

  const activeTable = tables[activeTableIdx] || tables[0];

  const handleAddTable = () => {
    const tableName = `table_${tables.length + 1}`;
    const newTable = {
      name: tableName,
      rows: 50,
      columns: [
        { name: `${tableName}_id`, type: "id", pk: true, unique: true, nullable: false }
      ]
    };
    setTables([...tables, newTable]);
    setActiveTableIdx(tables.length);
  };

  const handleRemoveTable = (idx) => {
    if (tables.length <= 1) {
      showNotification("Must retain at least one table in the schema.", "error");
      return;
    }
    const removedName = tables[idx].name;
    const nextTables = tables.filter((_, i) => i !== idx);
    setTables(nextTables);
    // Remove related relations
    setRelations(relations.filter((r) => r.parent !== removedName && r.child !== removedName));
    setActiveTableIdx(Math.max(0, idx - 1));
  };

  const handleParseColumnPrompt = async () => {
    if (!columnPrompt.trim()) return;
    setParsingColumn(true);
    try {
      const res = await fetch(`${API_BASE}/spec/parse-column`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: columnPrompt })
      });
      if (res.ok) {
        const parsed = await res.json();
        setNewColName(parsed.name || "");
        setNewColType(parsed.type || "float");
        setNewColMin(parsed.min !== null && parsed.min !== undefined ? parsed.min : "");
        setNewColMax(parsed.max !== null && parsed.max !== undefined ? parsed.max : "");
        setNewColUnique(parsed.unique || false);
        setNewColNullable(parsed.nullable || false);
        if (parsed.values) {
          setNewColCategories(Object.keys(parsed.values).join(", "));
        }
        showNotification(`Auto-configured column '${parsed.name}' (${parsed.type})`);
      } else {
        showNotification("Failed to parse column prompt", "error");
      }
    } catch (e) {
      showNotification(`Parser error: ${e.message}`, "error");
    } finally {
      setParsingColumn(false);
    }
  };

  const handleAddColumnToActiveTable = () => {
    if (!newColName.trim()) {
      showNotification("Column name cannot be blank", "error");
      return;
    }

    const colObj = {
      name: newColName.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      type: newColType,
      unique: newColUnique,
      nullable: newColNullable,
    };

    if (newColMin !== "") colObj.min = parseFloat(newColMin);
    if (newColMax !== "") colObj.max = parseFloat(newColMax);

    if (newColType === "category" && newColCategories.trim()) {
      const parts = newColCategories.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        const pMap = {};
        parts.forEach((p) => { pMap[p] = Math.round((1.0 / parts.length) * 100) / 100; });
        colObj.values = pMap;
      }
    }

    setTables((prev) => {
      const next = [...prev];
      const curTable = { ...next[activeTableIdx] };
      // Prevent duplicates
      curTable.columns = [...curTable.columns.filter((c) => c.name !== colObj.name), colObj];
      next[activeTableIdx] = curTable;
      return next;
    });

    // Reset column fields
    setNewColName("");
    setNewColMin("");
    setNewColMax("");
    setNewColCategories("");
    setColumnPrompt("");
    showNotification(`Added column '${colObj.name}' to ${activeTable.name}`);
  };

  const handleRemoveColumn = (colName) => {
    setTables((prev) => {
      const next = [...prev];
      const curTable = { ...next[activeTableIdx] };
      curTable.columns = curTable.columns.filter((c) => c.name !== colName);
      next[activeTableIdx] = curTable;
      return next;
    });
  };

  const handleAddRelation = () => {
    if (tables.length < 2) {
      showNotification("Need at least 2 tables to define a foreign key relationship", "error");
      return;
    }
    const parent = tables[0].name;
    const child = tables[1].name;
    const fk = `${parent}_id`;
    setRelations([...relations, { parent, child, fk, cardinality: "1:N", ratio: 2.0 }]);
  };

  const handleRemoveRelation = (idx) => {
    setRelations(relations.filter((_, i) => i !== idx));
  };

  const handleCompileAndGenerate = () => {
    // Compile to DomainSpec
    const compiledSpec = {
      domain: domainName,
      locale: locale,
      currency: currency,
      seed: seed,
      tables: tables.map((t) => ({
        name: t.name,
        rows: t.rows,
        columns: t.columns.map((c) => {
          const colOut = {
            name: c.name,
            type: c.type,
            pk: Boolean(c.pk),
            unique: Boolean(c.unique),
            nullable: Boolean(c.nullable)
          };
          if (c.min !== undefined && c.min !== null) colOut.min = c.min;
          if (c.max !== undefined && c.max !== null) colOut.max = c.max;
          if (c.dist) colOut.dist = c.dist;
          if (c.values) colOut.values = c.values;
          return colOut;
        })
      })),
      relations: relations.map((r) => ({
        parent: r.parent,
        child: r.child,
        fk: r.fk,
        cardinality: r.cardinality,
        ratio: parseFloat(r.ratio) || 1.0
      }))
    };

    onGenerateDataset(compiledSpec);
  };

  const totalRows = tables.reduce((acc, t) => acc + (parseInt(t.rows) || 0), 0);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      maxWidth: "1100px",
      margin: "0 auto",
      width: "100%",
      padding: "24px 0"
    }}>
      {/* Top Banner */}
      <div style={{
        padding: "20px 24px",
        borderRadius: "12px",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "1px",
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              padding: "2px 8px",
              borderRadius: "4px",
              textTransform: "uppercase"
            }}>
              Feature 2 • Guided Schema Construction
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
              Form-Based Relational Builder
            </span>
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-heading)", margin: 0 }}>
            Visual Schema & Table Designer
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
            Design your domain tables, column distributions, and foreign keys. Compiles seamlessly into DomainSpec.
          </p>
        </div>

        <button
          onClick={handleCompileAndGenerate}
          style={{
            padding: "10px 22px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "var(--primary)",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "var(--shadow-md)"
          }}
        >
          ⚡ Generate Dataset ({totalRows.toLocaleString()} rows)
        </button>
      </div>

      {/* Global Domain Settings */}
      <div style={{
        padding: "16px 20px",
        borderRadius: "12px",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px"
      }}>
        <div>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Domain Namespace
          </label>
          <input
            type="text"
            value={domainName}
            onChange={(e) => setDomainName(e.target.value)}
            style={{
              width: "100%",
              marginTop: "4px",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-heading)",
              fontSize: "13px",
              fontWeight: 600
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Locale & Identity
          </label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            style={{
              width: "100%",
              marginTop: "4px",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-heading)",
              fontSize: "13px",
              fontWeight: 600
            }}
          >
            <option value="en_PK">Pakistani (en_PK, PKR, CNIC, Phone)</option>
            <option value="en_US">American (en_US, USD)</option>
            <option value="de_DE">German (de_DE, EUR)</option>
            <option value="en_GB">British (en_GB, GBP)</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={{
              width: "100%",
              marginTop: "4px",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--primary)",
              fontSize: "13px",
              fontWeight: 700
            }}
          >
            <option value="PKR">PKR (Rs.)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Deterministic Seed
          </label>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value) || 42)}
            style={{
              width: "100%",
              marginTop: "4px",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-heading)",
              fontSize: "13px",
              fontWeight: 600
            }}
          />
        </div>
      </div>

      {/* Main Builder Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px" }}>
        
        {/* Left Column: Tables List */}
        <div style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "12px",
          border: "1px solid var(--border-light)",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-heading)", textTransform: "uppercase" }}>
              Tables ({tables.length})
            </span>
            <button
              onClick={handleAddTable}
              style={{
                padding: "4px 10px",
                borderRadius: "4px",
                border: "1px solid var(--primary-border)",
                backgroundColor: "var(--primary-light)",
                color: "var(--primary-dark)",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              + Add Table
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {tables.map((tbl, idx) => {
              const active = idx === activeTableIdx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveTableIdx(idx)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: active ? "1px solid var(--primary)" : "1px solid var(--border-light)",
                    backgroundColor: active ? "var(--primary-light)" : "var(--bg-subtle)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: active ? "var(--primary-dark)" : "var(--text-heading)" }}>
                      {tbl.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {tbl.rows} rows • {tbl.columns.length} columns
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveTable(idx); }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: "2px 6px"
                    }}
                    title="Remove Table"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Columns of Active Table */}
        <div style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "12px",
          border: "1px solid var(--border-light)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          {activeTable && (
            <>
              {/* Active Table Header & Row Count Setting */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: "14px",
                borderBottom: "1px solid var(--border-light)"
              }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase" }}>
                    Editing Table Schema
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-heading)", margin: "2px 0 0 0" }}>
                    {activeTable.name.toUpperCase()}
                  </h3>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>
                    Target Rows:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={activeTable.rows}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 1;
                      setTables((prev) => {
                        const next = [...prev];
                        next[activeTableIdx].rows = Math.max(1, v);
                        return next;
                      });
                    }}
                    style={{
                      width: "80px",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-default)",
                      backgroundColor: "var(--bg-surface)",
                      color: "var(--text-heading)",
                      fontSize: "13px",
                      fontWeight: 700,
                      textAlign: "center"
                    }}
                  />
                </div>
              </div>

              {/* Natural Language Column Prompt Auto-Fill */}
              <div style={{
                padding: "12px 14px",
                borderRadius: "8px",
                backgroundColor: "var(--bg-subtle)",
                border: "1px solid var(--border-light)",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--primary-dark)", textTransform: "uppercase" }}>
                  ✨ Plain-English Column Specification Prompt
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="e.g. salary in PKR, between 40,000 and 300,000, skewed low"
                    value={columnPrompt}
                    onChange={(e) => setColumnPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleParseColumnPrompt()}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-default)",
                      backgroundColor: "var(--bg-surface)",
                      color: "var(--text-heading)",
                      fontSize: "12px"
                    }}
                  />
                  <button
                    onClick={handleParseColumnPrompt}
                    disabled={parsingColumn}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "var(--primary)",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {parsingColumn ? "Parsing..." : "Auto-Fill Column"}
                  </button>
                </div>
              </div>

              {/* Current Columns Table */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                  Active Table Columns ({activeTable.columns.length})
                </div>

                <div style={{ border: "1px solid var(--border-light)", borderRadius: "8px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "var(--bg-subtle)", borderBottom: "1px solid var(--border-light)" }}>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700 }}>Column Name</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700 }}>Type</th>
                        <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700 }}>PK</th>
                        <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700 }}>Unique</th>
                        <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700 }}>Bounds / Categories</th>
                        <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTable.columns.map((c, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border-light)" }}>
                          <td style={{ padding: "8px 12px", fontWeight: 700, color: "var(--text-heading)" }}>
                            {c.name}
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <span style={{
                              padding: "2px 8px",
                              borderRadius: "4px",
                              backgroundColor: "var(--bg-subtle)",
                              fontSize: "10px",
                              fontWeight: 700,
                              color: "var(--primary-dark)"
                            }}>
                              {c.type}
                            </span>
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "center" }}>
                            {c.pk ? "✓" : "-"}
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "center" }}>
                            {c.unique ? "✓" : "-"}
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "center", color: "var(--text-muted)", fontSize: "11px" }}>
                            {c.min !== undefined && c.max !== undefined
                              ? `[${c.min} - ${c.max}]`
                              : c.values
                              ? `${Object.keys(c.values).length} values`
                              : "-"}
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "right" }}>
                            {!c.pk && (
                              <button
                                onClick={() => handleRemoveColumn(c.name)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#dc2626",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: 700
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add New Column Form Fields */}
              <div style={{
                padding: "14px",
                borderRadius: "8px",
                border: "1px dashed var(--border-default)",
                backgroundColor: "var(--bg-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-heading)", textTransform: "uppercase" }}>
                  Add Column Manually
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 100px", gap: "10px" }}>
                  <input
                    type="text"
                    placeholder="Column name (e.g. salary, city, status)"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-default)",
                      backgroundColor: "var(--bg-surface)",
                      fontSize: "12px",
                      color: "var(--text-heading)"
                    }}
                  />

                  <select
                    value={newColType}
                    onChange={(e) => setNewColType(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-default)",
                      backgroundColor: "var(--bg-surface)",
                      fontSize: "12px",
                      color: "var(--text-heading)"
                    }}
                  >
                    {COLUMN_TYPES.map((ct) => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Min value"
                    value={newColMin}
                    onChange={(e) => setNewColMin(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-default)",
                      backgroundColor: "var(--bg-surface)",
                      fontSize: "12px",
                      color: "var(--text-heading)"
                    }}
                  />

                  <input
                    type="number"
                    placeholder="Max value"
                    value={newColMax}
                    onChange={(e) => setNewColMax(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-default)",
                      backgroundColor: "var(--bg-surface)",
                      fontSize: "12px",
                      color: "var(--text-heading)"
                    }}
                  />
                </div>

                {newColType === "category" && (
                  <input
                    type="text"
                    placeholder="Category values comma-separated (e.g. retail, wholesale, enterprise)"
                    value={newColCategories}
                    onChange={(e) => setNewColCategories(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-default)",
                      backgroundColor: "var(--bg-surface)",
                      fontSize: "12px",
                      color: "var(--text-heading)"
                    }}
                  />
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={newColUnique}
                        onChange={(e) => setNewColUnique(e.target.checked)}
                      />
                      Unique Constraint
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={newColNullable}
                        onChange={(e) => setNewColNullable(e.target.checked)}
                      />
                      Nullable (5% null rate)
                    </label>
                  </div>

                  <button
                    onClick={handleAddColumnToActiveTable}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "6px",
                      border: "1px solid var(--primary-border)",
                      backgroundColor: "var(--primary-light)",
                      color: "var(--primary-dark)",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    + Add Column to Table
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Relationship Builder Section */}
      <div style={{
        backgroundColor: "var(--bg-surface)",
        borderRadius: "12px",
        border: "1px solid var(--border-light)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase" }}>
              Foreign Key Graph Builder
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-heading)", margin: "2px 0 0 0" }}>
              Parent → Child Table Relations & Cardinalities
            </h3>
          </div>

          <button
            onClick={handleAddRelation}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid var(--primary-border)",
              backgroundColor: "var(--primary-light)",
              color: "var(--primary-dark)",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            + Add Foreign Key Link
          </button>
        </div>

        {relations.length === 0 ? (
          <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
            No foreign keys linked. Click "+ Add Foreign Key Link" to define parent-child relationships.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {relations.map((rel, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-light)",
                  backgroundColor: "var(--bg-subtle)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 120px 100px 40px",
                  gap: "10px",
                  alignItems: "center"
                }}
              >
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Parent Table</label>
                  <select
                    value={rel.parent}
                    onChange={(e) => {
                      const next = [...relations];
                      next[idx].parent = e.target.value;
                      setRelations(next);
                    }}
                    style={{ width: "100%", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border-default)", fontSize: "12px", fontWeight: 600 }}
                  >
                    {tables.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Child Table</label>
                  <select
                    value={rel.child}
                    onChange={(e) => {
                      const next = [...relations];
                      next[idx].child = e.target.value;
                      setRelations(next);
                    }}
                    style={{ width: "100%", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border-default)", fontSize: "12px", fontWeight: 600 }}
                  >
                    {tables.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Foreign Key Column</label>
                  <input
                    type="text"
                    value={rel.fk}
                    onChange={(e) => {
                      const next = [...relations];
                      next[idx].fk = e.target.value;
                      setRelations(next);
                    }}
                    style={{ width: "100%", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border-default)", fontSize: "12px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Cardinality</label>
                  <select
                    value={rel.cardinality}
                    onChange={(e) => {
                      const next = [...relations];
                      next[idx].cardinality = e.target.value;
                      setRelations(next);
                    }}
                    style={{ width: "100%", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border-default)", fontSize: "12px" }}
                  >
                    <option value="1:1">1:1</option>
                    <option value="1:N">1:N</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Child Ratio</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={rel.ratio || 1.0}
                    onChange={(e) => {
                      const next = [...relations];
                      next[idx].ratio = parseFloat(e.target.value) || 1.0;
                      setRelations(next);
                    }}
                    style={{ width: "100%", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border-default)", fontSize: "12px", textAlign: "center" }}
                  />
                </div>

                <button
                  onClick={() => handleRemoveRelation(idx)}
                  style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "14px", marginTop: "14px" }}
                  title="Remove relation"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
