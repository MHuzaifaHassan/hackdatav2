import React, { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

const COLUMN_TYPES = [
  { value: "float", label: "Float / Numeric Currency" },
  { value: "int", label: "Integer" },
  { value: "category", label: "Category / Enum" },
  { value: "person_name", label: "Person Name" },
  { value: "email", label: "Email Address" },
  { value: "phone", label: "Phone Number" },
  { value: "city", label: "City" },
  { value: "address", label: "Address" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean Flag" },
  { value: "text_placeholder", label: "Narrative Text" },
];

export function AddColumnModal({ tableName, onClose, onAddColumn, showNotification }) {
  const [prompt, setPrompt] = useState("");
  const [parsing, setParsing] = useState(false);

  const [colName, setColName] = useState("");
  const [colType, setColType] = useState("float");
  const [colMin, setColMin] = useState("");
  const [colMax, setColMax] = useState("");
  const [colUnique, setColUnique] = useState(false);
  const [colNullable, setColNullable] = useState(false);
  const [colCategories, setColCategories] = useState("");

  const handleParsePrompt = async () => {
    if (!prompt.trim()) return;
    setParsing(true);
    try {
      const res = await fetch(`${API_BASE}/spec/parse-column`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      if (res.ok) {
        const parsed = await res.json();
        setColName(parsed.name || "");
        setColType(parsed.type || "float");
        setColMin(parsed.min !== null && parsed.min !== undefined ? parsed.min : "");
        setColMax(parsed.max !== null && parsed.max !== undefined ? parsed.max : "");
        setColUnique(parsed.unique || false);
        setColNullable(parsed.nullable || false);
        if (parsed.values) {
          setColCategories(Object.keys(parsed.values).join(", "));
        }
        showNotification?.(`Auto-configured column '${parsed.name}' (${parsed.type})`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!colName.trim()) return;

    const colObj = {
      name: colName.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      type: colType,
      unique: colUnique,
      nullable: colNullable
    };
    if (colMin !== "") colObj.min = parseFloat(colMin);
    if (colMax !== "") colObj.max = parseFloat(colMax);
    if (colType === "category" && colCategories.trim()) {
      const parts = colCategories.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        const pMap = {};
        parts.forEach((p) => { pMap[p] = Math.round((1.0 / parts.length) * 100) / 100; });
        colObj.values = pMap;
      }
    }

    onAddColumn(colObj);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(6px)",
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "var(--bg-surface)",
        borderRadius: "14px",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-md)",
        width: "100%",
        maxWidth: "520px",
        overflow: "hidden"
      }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-light)",
          backgroundColor: "var(--bg-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase" }}>
              Feature 3 • Data Mutation
            </div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--text-heading)" }}>
              Add Column to {tableName.toUpperCase()}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Quick NLP Prompt */}
          <div style={{
            padding: "10px 12px",
            borderRadius: "6px",
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border-light)",
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--primary-dark)", textTransform: "uppercase" }}>
              ✨ Plain-English Auto-Fill
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                placeholder="e.g. salary in PKR, between 40,000 and 300,000, skewed low"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  borderRadius: "4px",
                  border: "1px solid var(--border-default)",
                  fontSize: "12px",
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--text-heading)"
                }}
              />
              <button
                type="button"
                onClick={handleParsePrompt}
                disabled={parsing}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor: "var(--primary)",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {parsing ? "..." : "Auto-Fill"}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Column Name</label>
            <input
              type="text"
              required
              placeholder="e.g. bonus_amount"
              value={colName}
              onChange={(e) => setColName(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border-default)",
                fontSize: "13px",
                marginTop: "4px",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-heading)"
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Column Type</label>
              <select
                value={colType}
                onChange={(e) => setColType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-default)",
                  fontSize: "12px",
                  marginTop: "4px",
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--text-heading)"
                }}
              >
                {COLUMN_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Min</label>
                <input
                  type="number"
                  placeholder="Optional"
                  value={colMin}
                  onChange={(e) => setColMin(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-default)",
                    fontSize: "12px",
                    marginTop: "4px",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-heading)"
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Max</label>
                <input
                  type="number"
                  placeholder="Optional"
                  value={colMax}
                  onChange={(e) => setColMax(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-default)",
                    fontSize: "12px",
                    marginTop: "4px",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-heading)"
                  }}
                />
              </div>
            </div>
          </div>

          {colType === "category" && (
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Category Values (Comma separated)</label>
              <input
                type="text"
                placeholder="e.g. Bronze, Silver, Gold, Platinum"
                value={colCategories}
                onChange={(e) => setColCategories(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-default)",
                  fontSize: "12px",
                  marginTop: "4px",
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--text-heading)"
                }}
              />
            </div>
          )}

          <div style={{ display: "flex", gap: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
              <input type="checkbox" checked={colUnique} onChange={(e) => setColUnique(e.target.checked)} />
              Unique Constraint
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
              <input type="checkbox" checked={colNullable} onChange={(e) => setColNullable(e.target.checked)} />
              Nullable (5% null rate)
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-surface)",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 18px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              + Generate Column for Existing Rows
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddRowsModal({ tableName, currentCount, onClose, onAddRows }) {
  const [count, setCount] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddRows(parseInt(count) || 1);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(6px)",
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "var(--bg-surface)",
        borderRadius: "14px",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-md)",
        width: "100%",
        maxWidth: "420px",
        overflow: "hidden"
      }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-light)",
          backgroundColor: "var(--bg-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase" }}>
              Feature 3 • Continuous PK Generation
            </div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--text-heading)" }}>
              Add Rows to {tableName.toUpperCase()}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>
              Number of Rows to Append:
            </label>
            <input
              type="number"
              min="1"
              max="500"
              required
              value={count}
              onChange={(e) => setCount(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border-default)",
                fontSize: "14px",
                fontWeight: 700,
                marginTop: "6px",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-heading)"
              }}
            />
          </div>

          <div style={{
            padding: "10px 12px",
            borderRadius: "6px",
            backgroundColor: "var(--primary-light)",
            border: "1px solid var(--primary-border)",
            fontSize: "11px",
            color: "var(--primary-dark)",
            lineHeight: "1.4"
          }}>
            ✓ Primary keys will continuously auto-increment from current row count ({currentCount})<br/>
            ✓ Foreign keys will sample strictly from existing parents (0 orphans guaranteed)<br/>
            ✓ Unique constraints (e.g. emails) will be preserved
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-surface)",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 18px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              + Append {count} Rows
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CascadeDeleteModal({ cascadeData, onClose, onConfirmCascade }) {
  if (!cascadeData) return null;

  const totalDependents = Object.values(cascadeData.dependent_records || {}).reduce((acc, v) => acc + v, 0);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(15, 23, 42, 0.7)",
      backdropFilter: "blur(6px)",
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "var(--bg-surface)",
        borderRadius: "14px",
        border: "1px solid #f87171",
        boxShadow: "var(--shadow-md)",
        width: "100%",
        maxWidth: "480px",
        overflow: "hidden"
      }}>
        <div style={{
          padding: "16px 20px",
          backgroundColor: "#fef2f2",
          borderBottom: "1px solid #fee2e2",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <span style={{ fontSize: "20px" }}>⚠️</span>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#991b1b" }}>
              Cascade Delete Required
            </h3>
            <div style={{ fontSize: "11px", color: "#b91c1c", fontWeight: 600 }}>
              Zero-Orphan Relational Integrity Enforcement
            </div>
          </div>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-heading)", margin: 0 }}>
            Deleting parent record <b>{cascadeData.pk_value || `#${cascadeData.row_index + 1}`}</b> from table <b>{cascadeData.table_name}</b> has <b>{totalDependents}</b> dependent child record(s):
          </p>

          <div style={{
            padding: "10px 14px",
            borderRadius: "6px",
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border-light)"
          }}>
            {Object.entries(cascadeData.dependent_records || {}).map(([cTable, count]) => (
              <div key={cTable} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "3px 0" }}>
                <span style={{ fontWeight: 700, color: "var(--text-heading)" }}>{cTable.toUpperCase()}</span>
                <span style={{ fontWeight: 800, color: "#dc2626" }}>{count} record(s)</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            To ensure <b>0 orphan foreign keys</b>, confirming this action will cascade delete the parent row and all related child records across the database.
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-surface)",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirmCascade}
              style={{
                padding: "8px 18px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#dc2626",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              🗑️ Cascade Delete All ({totalDependents + 1} rows)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RenameColumnModal({ tableName, oldName, onClose, onRename }) {
  const [newName, setNewName] = useState(oldName);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim() || newName === oldName) return;
    onRename(oldName, newName.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(6px)",
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "var(--bg-surface)",
        borderRadius: "14px",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-md)",
        width: "100%",
        maxWidth: "380px",
        overflow: "hidden"
      }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-light)",
          backgroundColor: "var(--bg-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "var(--text-heading)" }}>
            Rename Column
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Current Column Name</label>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-heading)", marginTop: "2px" }}>
              {oldName}
            </div>
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>New Column Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border-default)",
                fontSize: "13px",
                marginTop: "4px",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-heading)"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-surface)",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 18px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
