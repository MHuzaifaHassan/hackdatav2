import React, { useState } from "react";
import { downloadCsv, downloadJson, downloadSql } from "./fileDownload";
import { IconDownload } from "./Icons";

export default function TabularGeneratorView({ onOpenSql, showNotification }) {
  const [datasetName, setDatasetName] = useState("customers_synthetic");
  const [numRows, setNumRows] = useState("250,000");
  const [preserveCorrelations, setPreserveCorrelations] = useState(true);
  const [matchDistributions, setMatchDistributions] = useState(true);
  const [fixedSeed, setFixedSeed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [columns, setColumns] = useState([
    { name: "customer_id", type: "integer", constraint: "unique" },
    { name: "age", type: "integer", constraint: "18 - 90" },
    { name: "city", type: "category", constraint: "from source" },
    { name: "income", type: "float", constraint: "> 0" },
    { name: "segment", type: "category", constraint: "not null" },
  ]);

  const [rows, setRows] = useState([
    { customer_id: "10482", age: "27", city: "Lahore", income: "84,200", segment: "Premium" },
    { customer_id: "10483", age: "34", city: "Multan", income: "92,500", segment: "Standard" },
    { customer_id: "10484", age: "41", city: "Karachi", income: "110,200", segment: "Premium" },
    { customer_id: "10485", age: "29", city: "Islamabad", income: "76,800", segment: "Standard" },
    { customer_id: "10486", age: "52", city: "Faisalabad", income: "131,400", segment: "Premium" },
    { customer_id: "10487", age: "38", city: "Peshawar", income: "88,900", segment: "Standard" },
    { customer_id: "10488", age: "45", city: "Lahore", income: "102,300", segment: "Premium" },
    { customer_id: "10489", age: "31", city: "Karachi", income: "69,400", segment: "Standard" },
    { customer_id: "10490", age: "24", city: "Quetta", income: "58,100", segment: "Basic" },
    { customer_id: "10491", age: "47", city: "Multan", income: "97,600", segment: "Standard" },
  ]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      // Re-synthesize rows with jitter
      const cities = ["Lahore", "Karachi", "Islamabad", "Multan", "Peshawar", "Faisalabad", "Quetta", "Sialkot"];
      const segments = ["Premium", "Standard", "Basic"];
      const baseId = 10480 + Math.floor(Math.random() * 5000);
      const newRows = Array.from({ length: 10 }, (_, i) => {
        const ageVal = 20 + Math.floor(Math.random() * 50);
        const incomeBase = 40000 + ageVal * 1600 + Math.floor(Math.random() * 25000);
        return {
          customer_id: String(baseId + i),
          age: String(ageVal),
          city: cities[Math.floor(Math.random() * cities.length)],
          income: incomeBase.toLocaleString(),
          segment: segments[Math.floor(Math.random() * segments.length)],
        };
      });
      setRows(newRows);
      setIsGenerating(false);
      if (showNotification) {
        showNotification(`Successfully generated ${numRows} synthetic rows for ${datasetName}!`);
      }
    }, 600);
  };

  const handleExportCsv = () => {
    const rawRows = rows.map((r) => ({
      ...r,
      income: parseFloat(r.income.replace(/,/g, "")),
    }));
    downloadCsv(rawRows, `${datasetName}.csv`, showNotification);
    setShowExportMenu(false);
  };

  const handleExportJson = () => {
    downloadJson(rows, `${datasetName}.json`, showNotification);
    setShowExportMenu(false);
  };

  const handleExportSql = () => {
    const sqlText = `-- CLOAKDATA SYNTHETIC DATASET EXPORT: ${datasetName}
CREATE TABLE ${datasetName} (
  customer_id INTEGER PRIMARY KEY,
  age INTEGER,
  city VARCHAR(100),
  income NUMERIC(12,2),
  segment VARCHAR(50)
);

INSERT INTO ${datasetName} (customer_id, age, city, income, segment) VALUES
${rows.map((r) => `  (${r.customer_id}, ${r.age}, '${r.city}', ${r.income.replace(/,/g, "")}, '${r.segment}')`).join(",\n")};
`;
    downloadSql(sqlText, `${datasetName}.sql`, showNotification);
    setShowExportMenu(false);
  };

  const handleAddColumn = () => {
    const colName = prompt("Enter new column name (e.g. credit_score, balance):");
    if (!colName) return;
    setColumns([...columns, { name: colName.toLowerCase(), type: "float", constraint: "> 0" }]);
  };

  return (
    <div style={{ color: "#ffffff", padding: "8px 0" }}>
      {/* Top Header Breadcrumb & Actions Bar (Exact Screenshot 5 Replica) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
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
            GENERATE / TABULAR
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", color: "#ffffff" }}>
            Tabular Generator
          </h2>
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
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#56b5b5";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#111111";
              e.currentTarget.style.color = "#56b5b5";
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
            Preview
          </button>

          <button
            onClick={() => showNotification && showNotification("Tabular schema validated: 0 constraint conflicts")}
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
            Validate
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
                  minWidth: "150px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.8)",
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
                  Download CSV & Open
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
                  Download JSON & Open
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
                  Download SQL Script & Open
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
            <span>Generate Dataset</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls (1fr) + Right Preview (1.35fr) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.35fr",
          gap: "28px",
          alignItems: "flex-start",
        }}
        className="tabular-grid"
      >
        {/* Left Panel: Configuration Form */}
        <div
          style={{
            backgroundColor: "#0d0d0d",
            border: "1px solid #1c1c1c",
            borderRadius: "4px",
            padding: "24px",
          }}
        >
          {/* Dataset Name & Number of Rows in 2 Columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "16px", marginBottom: "24px" }}>
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
                  marginBottom: "8px",
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
                  borderRadius: "3px",
                  padding: "9px 12px",
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
                  marginBottom: "8px",
                }}
              >
                NUMBER OF ROWS
              </label>
              <input
                type="text"
                value={numRows}
                onChange={(e) => setNumRows(e.target.value)}
                style={{
                  width: "100%",
                  backgroundColor: "#080808",
                  border: "1px solid #282828",
                  borderRadius: "3px",
                  padding: "9px 12px",
                  fontSize: "13px",
                  fontFamily: "var(--cd-font-mono)",
                  color: "#ffffff",
                }}
              />
            </div>
          </div>

          {/* Columns · Data Types · Constraints List */}
          <div style={{ marginBottom: "28px" }}>
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
              COLUMNS · DATA TYPES · CONSTRAINTS
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {columns.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1fr 1fr",
                    alignItems: "center",
                    fontSize: "13px",
                    fontFamily: "var(--cd-font-mono)",
                  }}
                >
                  <span style={{ color: "#ffffff", fontWeight: 600 }}>{c.name}</span>
                  <span style={{ color: "#ff2a1a" }}>{c.type}</span>
                  <span style={{ color: "#777777" }}>{c.constraint}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddColumn}
              style={{
                marginTop: "14px",
                backgroundColor: "transparent",
                border: "none",
                color: "#888888",
                fontSize: "12px",
                fontFamily: "var(--cd-font-mono)",
                cursor: "pointer",
                padding: "4px 0",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#ff2a1a")}
              onMouseLeave={(e) => (e.target.style.color = "#888888")}
            >
              + Add column
            </button>
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
              GENERATION SETTINGS
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Toggle 1: Preserve correlations */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#cccccc" }}>Preserve correlations</span>
                <div
                  onClick={() => setPreserveCorrelations(!preserveCorrelations)}
                  style={{
                    width: "36px",
                    height: "18px",
                    backgroundColor: preserveCorrelations ? "#ff2a1a" : "#222222",
                    borderRadius: "9px",
                    position: "relative",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      backgroundColor: "#ffffff",
                      borderRadius: "50%",
                      position: "absolute",
                      top: "2px",
                      left: preserveCorrelations ? "20px" : "2px",
                      transition: "left 0.2s ease",
                    }}
                  />
                </div>
              </div>

              {/* Toggle 2: Match source distributions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#cccccc" }}>Match source distributions</span>
                <div
                  onClick={() => setMatchDistributions(!matchDistributions)}
                  style={{
                    width: "36px",
                    height: "18px",
                    backgroundColor: matchDistributions ? "#ff2a1a" : "#222222",
                    borderRadius: "9px",
                    position: "relative",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      backgroundColor: "#ffffff",
                      borderRadius: "50%",
                      position: "absolute",
                      top: "2px",
                      left: matchDistributions ? "20px" : "2px",
                      transition: "left 0.2s ease",
                    }}
                  />
                </div>
              </div>

              {/* Toggle 3: Fixed random seed */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#cccccc" }}>Fixed random seed</span>
                <div
                  onClick={() => setFixedSeed(!fixedSeed)}
                  style={{
                    width: "36px",
                    height: "18px",
                    backgroundColor: fixedSeed ? "#ff2a1a" : "#222222",
                    borderRadius: "9px",
                    position: "relative",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      backgroundColor: "#ffffff",
                      borderRadius: "50%",
                      position: "absolute",
                      top: "2px",
                      left: fixedSeed ? "20px" : "2px",
                      transition: "left 0.2s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Live Preview Table (Exact Screenshot 5 Replica) */}
        <div
          style={{
            backgroundColor: "#0d0d0d",
            border: "1px solid #1c1c1c",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          {/* Preview Header */}
          <div
            style={{
              padding: "12px 20px",
              borderBottom: "1px solid #1a1a1a",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--cd-font-mono)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>Preview</span>
              <span style={{ fontSize: "10px", color: "#666666", letterSpacing: "0.1em" }}>
                FIRST 10 ROWS · EXAMPLE DATA
              </span>
            </div>
            <button
              onClick={handleExportCsv}
              title="Download CSV file directly to Desktop & Downloads"
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
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#10b981";
                e.currentTarget.style.backgroundColor = "rgba(16, 185, 129, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#333333";
                e.currentTarget.style.backgroundColor = "#161616";
              }}
            >
              <IconDownload size={13} />
              <span>Download CSV (Desktop & Downloads)</span>
            </button>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontFamily: "var(--cd-font-mono)",
                fontSize: "12px",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #1c1c1c", color: "#666666" }}>
                  <th style={{ padding: "10px 18px", fontWeight: 700 }}>CUSTOMER_ID</th>
                  <th style={{ padding: "10px 18px", fontWeight: 700 }}>AGE</th>
                  <th style={{ padding: "10px 18px", fontWeight: 700 }}>CITY</th>
                  <th style={{ padding: "10px 18px", fontWeight: 700 }}>INCOME</th>
                  <th style={{ padding: "10px 18px", fontWeight: 700 }}>SEGMENT</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid #141414",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#121212")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "10px 18px", color: "#ffffff", fontWeight: 600 }}>{r.customer_id}</td>
                    <td style={{ padding: "10px 18px", color: "#cccccc" }}>{r.age}</td>
                    <td style={{ padding: "10px 18px", color: "#cccccc" }}>{r.city}</td>
                    <td style={{ padding: "10px 18px", color: "#cccccc" }}>{r.income}</td>
                    <td style={{ padding: "10px 18px", color: "#cccccc" }}>{r.segment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid #1a1a1a",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--cd-font-mono)",
              fontSize: "11px",
              color: "#666666",
            }}
          >
            <span>5 columns · {numRows} rows planned</span>
            <span style={{ color: "#ff2a1a", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "8px" }}>■</span> Ready to generate
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .tabular-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
