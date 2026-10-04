import React, { useState } from "react";

export default function ParsedRequestModal({ parsedData, onClose, onConfirm }) {
  if (!parsedData) return null;

  const [rowCounts, setRowCounts] = useState(() => {
    return { ...parsedData.row_counts };
  });

  const [selectedLocale, setSelectedLocale] = useState(parsedData.locale || "en_US");
  const [selectedCurrency, setSelectedCurrency] = useState(parsedData.currency || "USD");

  const handleCountChange = (tableName, delta) => {
    setRowCounts((prev) => {
      const current = prev[tableName] || 1;
      const nextVal = Math.max(1, current + delta);
      return { ...prev, [tableName]: nextVal };
    });
  };

  const handleManualCount = (tableName, val) => {
    const num = parseInt(val) || 1;
    setRowCounts((prev) => ({ ...prev, [tableName]: Math.max(1, num) }));
  };

  const totalCalculatedRows = Object.values(rowCounts).reduce((acc, v) => acc + (v || 0), 0);

  const handleProceed = () => {
    // Clone spec and apply user-confirmed row counts and locale
    const confirmedSpec = JSON.parse(JSON.stringify(parsedData.spec || {}));
    confirmedSpec.locale = selectedLocale;
    confirmedSpec.currency = selectedCurrency;
    if (confirmedSpec.tables) {
      for (const t of confirmedSpec.tables) {
        if (rowCounts[t.name]) {
          t.rows = rowCounts[t.name];
        }
      }
    }
    onConfirm(confirmedSpec, parsedData.raw_query);
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
        borderRadius: "16px",
        border: "1px solid var(--border-default)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        width: "100%",
        maxWidth: "680px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "fadeIn 0.2s ease-out"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border-light)",
          backgroundColor: "var(--bg-subtle)",
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
                Feature 1 • Natural Language Control
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                Query Specification Preview
              </span>
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-heading)", margin: 0 }}>
              Confirm Parsed Request
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px 8px",
              borderRadius: "6px"
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Raw query quote */}
          <div style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "var(--bg-subtle)",
            borderLeft: "4px solid var(--primary)",
            fontSize: "13px",
            color: "var(--text-heading)",
            fontStyle: "italic"
          }}>
            "{parsedData.raw_query}"
          </div>

          {/* Locale & Currency Badges */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px"
          }}>
            <div style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--border-light)",
              backgroundColor: "var(--bg-surface)"
            }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Target Domain
              </div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--primary-dark)", marginTop: "2px" }}>
                {(parsedData.domain || "fintech").toUpperCase()}
              </div>
            </div>

            <div style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--border-light)",
              backgroundColor: "var(--bg-surface)"
            }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Locale & Identity
              </div>
              <select
                value={selectedLocale}
                onChange={(e) => setSelectedLocale(e.target.value)}
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--text-heading)",
                  border: "none",
                  background: "transparent",
                  width: "100%",
                  cursor: "pointer",
                  marginTop: "2px"
                }}
              >
                <option value="en_PK">Pakistani (en_PK, CNIC, Phone)</option>
                <option value="en_US">American (en_US, USD)</option>
                <option value="de_DE">German (de_DE, EUR)</option>
                <option value="en_GB">British (en_GB, GBP)</option>
              </select>
            </div>

            <div style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--border-light)",
              backgroundColor: "var(--bg-surface)"
            }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Currency
              </div>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--primary)",
                  border: "none",
                  background: "transparent",
                  width: "100%",
                  cursor: "pointer",
                  marginTop: "2px"
                }}
              >
                <option value="PKR">PKR (Rs.)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {/* Applied Note / Defaults banner */}
          <div style={{
            padding: "10px 14px",
            borderRadius: "8px",
            backgroundColor: parsedData.locale_default_applied ? "#fef3c7" : "var(--primary-light)",
            color: parsedData.locale_default_applied ? "#92400e" : "var(--primary-dark)",
            fontSize: "12px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span>ℹ️</span>
            <span>{parsedData.locale_note || parsedData.default_note || "All entity bounds and relational rules parsed successfully."}</span>
          </div>

          {/* Table Counts Editable List */}
          <div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px"
            }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-heading)", textTransform: "uppercase" }}>
                Per-Table Record Quantities
              </span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary)" }}>
                Total: {totalCalculatedRows.toLocaleString()} rows
              </span>
            </div>

            <div style={{
              border: "1px solid var(--border-light)",
              borderRadius: "8px",
              overflow: "hidden"
            }}>
              {Object.entries(rowCounts).map(([tableName, count], idx) => {
                return (
                  <div
                    key={tableName}
                    style={{
                      padding: "10px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-subtle)",
                      borderBottom: idx === Object.entries(rowCounts).length - 1 ? "none" : "1px solid var(--border-light)"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-heading)" }}>
                        {tableName.toUpperCase()}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {parsedData.tables?.find((t) => t.name === tableName)?.columns?.length || 5} schema columns
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => handleCountChange(tableName, -10)}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "4px",
                          border: "1px solid var(--border-default)",
                          backgroundColor: "var(--bg-surface)",
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: "14px",
                          color: "var(--text-heading)"
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={count}
                        onChange={(e) => handleManualCount(tableName, e.target.value)}
                        style={{
                          width: "70px",
                          padding: "4px 8px",
                          textAlign: "center",
                          borderRadius: "4px",
                          border: "1px solid var(--border-default)",
                          fontSize: "13px",
                          fontWeight: 700,
                          backgroundColor: "var(--bg-surface)",
                          color: "var(--text-heading)"
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleCountChange(tableName, 10)}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "4px",
                          border: "1px solid var(--border-default)",
                          backgroundColor: "var(--bg-surface)",
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: "14px",
                          color: "var(--text-heading)"
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Relations overview */}
          {parsedData.relations && parsedData.relations.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                Identified Cardinalities & Foreign Keys (0 Orphan Guarantee)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {parsedData.relations.map((r, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      backgroundColor: "var(--bg-subtle)",
                      border: "1px solid var(--border-light)",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text-heading)"
                    }}
                  >
                    {r.parent} → {r.child} ({r.cardinality} via {r.fk})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--border-light)",
          backgroundColor: "var(--bg-subtle)",
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px"
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-heading)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            style={{
              padding: "8px 20px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            🚀 Confirm & Generate Dataset ({totalCalculatedRows.toLocaleString()} rows)
          </button>
        </div>
      </div>
    </div>
  );
}
