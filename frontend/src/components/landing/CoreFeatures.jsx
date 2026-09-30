import React, { useState } from "react";

export default function CoreFeatures({ onOpenWorkspace }) {
  const [activeTab, setActiveTab] = useState("01"); // "01" | "02" | "03" | "04" | "05"

  const featureTabs = [
    {
      id: "01",
      title: "Tabular Data",
      desc: "Realistic tables with preserved statistical patterns.",
      category: "GENERATE",
    },
    {
      id: "02",
      title: "Relational Data",
      desc: "Interconnected databases with keys and dependencies.",
      category: "GENERATE",
    },
    {
      id: "03",
      title: "Document Generator",
      desc: "Structured synthetic documents for AI pipelines.",
      category: "GENERATE",
    },
    {
      id: "04",
      title: "Data Profiler",
      desc: "Types, distributions, correlations, outliers.",
      category: "ANALYZE",
    },
    {
      id: "05",
      title: "Data Tester",
      desc: "Schema, constraint and quality validation.",
      category: "VALIDATE",
    },
  ];

  // State for interactive features
  const [runningTests, setRunningTests] = useState(false);
  const [testsCompleted, setTestsCompleted] = useState(true);

  const handleRunTests = () => {
    setRunningTests(true);
    setTimeout(() => {
      setRunningTests(false);
      setTestsCompleted(true);
    }, 1200);
  };

  return (
    <section
      id="features"
      style={{
        backgroundColor: "#050505",
        borderBottom: "1px solid var(--cd-border-subtle)",
        padding: "100px 0",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "0 24px" }}>
        {/* Section Header (Matching Reference Screenshot 3) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: "48px",
            alignItems: "flex-end",
            marginBottom: "64px",
          }}
          className="features-header-grid"
        >
          <div>
            <h2
              style={{
                fontSize: "clamp(42px, 5.5vw, 76px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                color: "#ffffff",
                marginBottom: "20px",
              }}
            >
              One platform.
              <br />
              <span style={{ color: "#a0a0a0" }}>Every stage of</span>
              <br />
              <span style={{ color: "#ff2a1a" }}>synthetic data.</span>
            </h2>
            <p
              style={{
                fontSize: "17px",
                lineHeight: 1.6,
                color: "#a0a0a0",
                maxWidth: "520px",
              }}
            >
              Generate realistic data, preserve important relationships, understand
              datasets, and validate quality from a single workspace.
            </p>
          </div>

          {/* Feature Quick Selector List (Matching Screenshot 3) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              borderLeft: "1px solid #1a1a1a",
              paddingLeft: "32px",
            }}
          >
            {featureTabs.map((item) => {
              const isSelected = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    padding: "14px 18px",
                    borderRadius: "4px",
                    backgroundColor: isSelected ? "#0f0f0f" : "transparent",
                    border: isSelected ? "1px solid #222222" : "1px solid transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "#0a0a0a";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
                    <span
                      style={{
                        fontFamily: "var(--cd-font-mono)",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#ff2a1a",
                      }}
                    >
                      {item.id}
                    </span>
                    <div>
                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: 700,
                          color: isSelected ? "#ffffff" : "#cccccc",
                          letterSpacing: "-0.01em",
                          margin: 0,
                        }}
                      >
                        {item.title}
                      </h4>
                      <p style={{ fontSize: "12px", color: "#666666", margin: "2px 0 0 0" }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <span
                    style={{
                      fontFamily: "var(--cd-font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.12em",
                      padding: "4px 8px",
                      borderRadius: "2px",
                      border: item.category === "VALIDATE" ? "1px solid rgba(255, 42, 26, 0.4)" : "1px solid #222222",
                      color: item.category === "VALIDATE" ? "#ff2a1a" : "#777777",
                      backgroundColor: "#050505",
                    }}
                  >
                    {item.category === "VALIDATE" ? "■ " : ""}
                    {item.category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Detail Canvas Container */}
        <div
          style={{
            backgroundColor: "#0a0a0a",
            border: "1px solid #1c1c1c",
            borderRadius: "6px",
            padding: "48px",
            minHeight: "560px",
            position: "relative",
            overflow: "hidden",
          }}
          className="feature-canvas-card"
        >
          {/* Subtle background tech coordinates */}
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "24px",
              fontFamily: "var(--cd-font-mono)",
              fontSize: "10px",
              color: "#333333",
              letterSpacing: "0.1em",
            }}
          >
            SYS://CLOAKDATA/STAGE_{activeTab}
          </div>

          {/* ========================================================================= */}
          {/* TAB 01: TABULAR DATA SHOWCASE (Matches Reference Screenshot 4)           */}
          {/* ========================================================================= */}
          {activeTab === "01" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.35fr",
                gap: "48px",
                alignItems: "center",
              }}
              className="feature-inner-grid"
            >
              {/* Left Column: Description & Tags */}
              <div>
                <div
                  style={{
                    fontFamily: "var(--cd-font-mono)",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    color: "#ff2a1a",
                    marginBottom: "16px",
                  }}
                >
                  01 — TABULAR DATA
                </div>
                <h3
                  style={{
                    fontSize: "clamp(36px, 4.5vw, 56px)",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: "#ffffff",
                    lineHeight: 1.1,
                    marginBottom: "24px",
                  }}
                >
                  Tabular
                  <br />
                  Data
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.65,
                    color: "#a0a0a0",
                    marginBottom: "36px",
                  }}
                >
                  Generate realistic tabular datasets while preserving important statistical
                  patterns and relationships.
                </p>

                {/* Status Indicators (Matching Screenshot 4) */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div
                    style={{
                      fontFamily: "var(--cd-font-mono)",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: "#ff2a1a",
                      backgroundColor: "#160a09",
                      border: "1px solid rgba(255, 42, 26, 0.4)",
                      padding: "6px 12px",
                      borderRadius: "2px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "8px" }}>■</span> GENERATED
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--cd-font-mono)",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: "#888888",
                      backgroundColor: "#111111",
                      border: "1px solid #222222",
                      padding: "6px 12px",
                      borderRadius: "2px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "8px" }}>■</span> SYNTHETIC
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--cd-font-mono)",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: "#10b981",
                      backgroundColor: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      padding: "6px 12px",
                      borderRadius: "2px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "8px" }}>■</span> VALIDATED
                  </div>
                </div>

                <div style={{ marginTop: "32px" }}>
                  <button
                    onClick={onOpenWorkspace}
                    style={{
                      backgroundColor: "#ff2a1a",
                      color: "#ffffff",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    Open Tabular Generator →
                  </button>
                </div>
              </div>

              {/* Right Column: Interactive Synthetic Data Table (Exact Replica of Screenshot 4) */}
              <div
                style={{
                  backgroundColor: "#0d0d0d",
                  border: "1px solid #222222",
                  borderRadius: "4px",
                  overflow: "hidden",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.7)",
                }}
              >
                {/* Table Header Bar */}
                <div
                  style={{
                    backgroundColor: "#111111",
                    padding: "12px 18px",
                    borderBottom: "1px solid #1c1c1c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontFamily: "var(--cd-font-mono)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#ff2a1a", fontSize: "10px" }}>■</span>
                    <span style={{ color: "#ffffff", fontSize: "13px", fontWeight: 700 }}>
                      customers_synthetic
                    </span>
                  </div>
                  <span style={{ color: "#666666", fontSize: "11px", letterSpacing: "0.08em" }}>
                    EXAMPLE DATA · DEMO UI
                  </span>
                </div>

                {/* Table Structure */}
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      textAlign: "left",
                      fontSize: "13px",
                      fontFamily: "var(--cd-font-mono)",
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1f1f1f", color: "#888888" }}>
                        <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: "11px" }}>
                          CUSTOMER_ID
                          <div style={{ fontSize: "9px", color: "#555555", marginTop: "2px" }}>INTEGER</div>
                        </th>
                        <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: "11px" }}>
                          AGE
                          <div style={{ fontSize: "9px", color: "#555555", marginTop: "2px" }}>INTEGER</div>
                        </th>
                        <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: "11px" }}>
                          CITY
                          <div style={{ fontSize: "9px", color: "#555555", marginTop: "2px" }}>TEXT</div>
                        </th>
                        <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: "11px" }}>
                          INCOME
                          <div style={{ fontSize: "9px", color: "#555555", marginTop: "2px" }}>FLOAT</div>
                        </th>
                        <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: "11px" }}>
                          SEGMENT
                          <div style={{ fontSize: "9px", color: "#555555", marginTop: "2px" }}>CATEGORY</div>
                        </th>
                        <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: "11px" }}>
                          STATUS
                          <div style={{ fontSize: "9px", color: "#555555", marginTop: "2px" }}>—</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid #161616" }}>
                        <td style={{ padding: "12px 14px", color: "#ff2a1a", fontWeight: 600 }}>10482</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>27</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>Lahore</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>84,200</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>Premium</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ color: "#10b981", fontSize: "11px" }}>● VALID</span>
                        </td>
                      </tr>

                      <tr style={{ borderBottom: "1px solid #161616" }}>
                        <td style={{ padding: "12px 14px", color: "#ff2a1a", fontWeight: 600 }}>10483</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>34</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>Multan</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>92,500</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>Standard</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ color: "#10b981", fontSize: "11px" }}>● VALID</span>
                        </td>
                      </tr>

                      {/* Highlighted Red Tint Row (Exact Match to Screenshot 4) */}
                      <tr
                        style={{
                          borderBottom: "1px solid #3d1410",
                          backgroundColor: "#200908",
                        }}
                      >
                        <td style={{ padding: "12px 14px", color: "#ff4d3f", fontWeight: 700 }}>10484</td>
                        <td style={{ padding: "12px 14px", color: "#ffffff", fontWeight: 600 }}>41</td>
                        <td style={{ padding: "12px 14px", color: "#ffffff", fontWeight: 600 }}>Karachi</td>
                        <td style={{ padding: "12px 14px", color: "#ffffff", fontWeight: 600 }}>110,200</td>
                        <td style={{ padding: "12px 14px", color: "#ffffff", fontWeight: 600 }}>Premium</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ color: "#ff2a1a", fontSize: "11px", fontWeight: 700 }}>● MIS</span>
                        </td>
                      </tr>

                      <tr style={{ borderBottom: "1px solid #161616" }}>
                        <td style={{ padding: "12px 14px", color: "#ff2a1a", fontWeight: 600 }}>10485</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>29</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>Islamabad</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>76,800</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>Standard</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ color: "#10b981", fontSize: "11px" }}>● VALID</span>
                        </td>
                      </tr>

                      <tr style={{ borderBottom: "1px solid #161616" }}>
                        <td style={{ padding: "12px 14px", color: "#ff2a1a", fontWeight: 600 }}>10486</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>52</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>Faisalabad</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>131,400</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>Premium</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ color: "#10b981", fontSize: "11px" }}>● VALID</span>
                        </td>
                      </tr>

                      <tr style={{ borderBottom: "1px solid #161616" }}>
                        <td style={{ padding: "12px 14px", color: "#ff2a1a", fontWeight: 600 }}>10487</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>38</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>Peshawar</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>88,900</td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f0" }}>Standard</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ color: "#10b981", fontSize: "11px" }}>● VALID</span>
                        </td>
                      </tr>

                      {/* Dim Progress Row */}
                      <tr>
                        <td style={{ padding: "12px 14px", color: "#333333" }}>10488</td>
                        <td style={{ padding: "12px 14px", color: "#333333" }}>—</td>
                        <td style={{ padding: "12px 14px", color: "#333333" }}>—</td>
                        <td style={{ padding: "12px 14px", color: "#333333" }}>—</td>
                        <td style={{ padding: "12px 14px", color: "#333333" }}>—</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ color: "#666666", fontSize: "11px" }}>● GENERATING</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Metadata Bar (Matching Screenshot 4) */}
                <div
                  style={{
                    backgroundColor: "#111111",
                    padding: "10px 18px",
                    borderTop: "1px solid #1c1c1c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontFamily: "var(--cd-font-mono)",
                    fontSize: "11px",
                    color: "#777777",
                  }}
                >
                  <span>4 columns · 7 rows shown</span>
                  <span style={{ color: "#a0a0a0" }}>Correlation preserved: age + income</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 02: RELATIONAL DATA SHOWCASE (Matches Reference Screenshot 5)         */}
          {/* ========================================================================= */}
          {activeTab === "02" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.35fr",
                gap: "48px",
                alignItems: "center",
              }}
              className="feature-inner-grid"
            >
              {/* Left Column */}
              <div>
                <div
                  style={{
                    fontFamily: "var(--cd-font-mono)",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    color: "#ff2a1a",
                    marginBottom: "16px",
                  }}
                >
                  02 — RELATIONAL DATA
                </div>
                <h3
                  style={{
                    fontSize: "clamp(36px, 4.5vw, 56px)",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: "#ffffff",
                    lineHeight: 1.1,
                    marginBottom: "24px",
                  }}
                >
                  Relational
                  <br />
                  Data
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.65,
                    color: "#a0a0a0",
                    marginBottom: "36px",
                  }}
                >
                  Generate interconnected synthetic databases while preserving relationships,
                  dependencies, keys, and realistic data structures.
                </p>

                {/* Legend (Matching Screenshot 5) */}
                <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        backgroundColor: "#ff2a1a",
                        color: "#ffffff",
                        fontSize: "10px",
                        fontWeight: 800,
                        padding: "2px 5px",
                        borderRadius: "2px",
                        fontFamily: "var(--cd-font-mono)",
                      }}
                    >
                      PK
                    </span>
                    <span style={{ fontSize: "13px", color: "#a0a0a0" }}>Primary key</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        border: "1px solid #ff2a1a",
                        color: "#ff2a1a",
                        fontSize: "10px",
                        fontWeight: 800,
                        padding: "2px 5px",
                        borderRadius: "2px",
                        fontFamily: "var(--cd-font-mono)",
                      }}
                    >
                      FK
                    </span>
                    <span style={{ fontSize: "13px", color: "#a0a0a0" }}>Foreign key</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontFamily: "var(--cd-font-mono)",
                        color: "#ff2a1a",
                        fontWeight: 800,
                        fontSize: "12px",
                      }}
                    >
                      1 — N
                    </span>
                    <span style={{ fontSize: "13px", color: "#a0a0a0" }}>Relation</span>
                  </div>
                </div>

                <div style={{ marginTop: "32px" }}>
                  <button
                    onClick={onOpenWorkspace}
                    style={{
                      backgroundColor: "#ff2a1a",
                      color: "#ffffff",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    Open Relational Schema Builder →
                  </button>
                </div>
              </div>

              {/* Right Column: Database Relationship Diagram (Matches Reference Screenshot 5) */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "440px",
                  backgroundColor: "#080808",
                  border: "1px solid #1c1c1c",
                  borderRadius: "4px",
                  padding: "16px",
                  overflow: "hidden",
                }}
              >
                {/* SVG Connection Lines overlay */}
                <svg
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                >
                  {/* Customers -> Orders */}
                  <path
                    d="M175 60 H220 V195 H255"
                    stroke="#ff2a1a"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <text x="185" y="55" fill="#ff2a1a" fontFamily="JetBrains Mono" fontSize="10">1</text>
                  <text x="240" y="190" fill="#ff2a1a" fontFamily="JetBrains Mono" fontSize="10">N</text>

                  {/* Products -> Orders */}
                  <path
                    d="M375 75 H340 V225 H365"
                    stroke="#ff2a1a"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <text x="360" y="70" fill="#ff2a1a" fontFamily="JetBrains Mono" fontSize="10">1</text>
                  <text x="350" y="240" fill="#ff2a1a" fontFamily="JetBrains Mono" fontSize="10">N</text>

                  {/* Orders -> Payments */}
                  <path
                    d="M365 280 H380 V325 H375"
                    stroke="#ff2a1a"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <text x="368" y="275" fill="#ff2a1a" fontFamily="JetBrains Mono" fontSize="10">1</text>
                  <text x="382" y="320" fill="#ff2a1a" fontFamily="JetBrains Mono" fontSize="10">N</text>
                </svg>

                {/* Table Card 1: customers */}
                <div
                  style={{
                    position: "absolute",
                    top: "20px",
                    left: "24px",
                    width: "150px",
                    backgroundColor: "#111111",
                    border: "1px solid #222222",
                    borderRadius: "4px",
                    zIndex: 2,
                    fontFamily: "var(--cd-font-mono)",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.5)",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 10px",
                      borderBottom: "1px solid #1c1c1c",
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#ffffff",
                    }}
                  >
                    <span>customers</span>
                    <span style={{ color: "#555555", fontSize: "9px" }}>TABLE</span>
                  </div>
                  <div style={{ padding: "8px 10px", fontSize: "11px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#ffffff" }}>customer_id</span>
                      <span style={{ backgroundColor: "#ff2a1a", color: "#fff", fontSize: "9px", padding: "1px 4px", borderRadius: "2px" }}>PK</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#888888" }}>name</span>
                      <span style={{ color: "#555555" }}>text</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#888888" }}>city</span>
                      <span style={{ color: "#555555" }}>text</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#888888" }}>segment</span>
                      <span style={{ color: "#555555" }}>enum</span>
                    </div>
                  </div>
                </div>

                {/* Table Card 2: orders (Highlighted with subtle red border) */}
                <div
                  style={{
                    position: "absolute",
                    top: "140px",
                    left: "255px",
                    width: "170px",
                    backgroundColor: "#111111",
                    border: "1px solid rgba(255, 42, 26, 0.4)",
                    borderRadius: "4px",
                    zIndex: 2,
                    fontFamily: "var(--cd-font-mono)",
                    boxShadow: "0 8px 24px rgba(255, 42, 26, 0.15)",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 10px",
                      borderBottom: "1px solid #1c1c1c",
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#ffffff",
                    }}
                  >
                    <span>orders</span>
                    <span style={{ color: "#ff2a1a", fontSize: "9px" }}>TABLE</span>
                  </div>
                  <div style={{ padding: "8px 10px", fontSize: "11px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#ffffff" }}>order_id</span>
                      <span style={{ backgroundColor: "#ff2a1a", color: "#fff", fontSize: "9px", padding: "1px 4px", borderRadius: "2px" }}>PK</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#a0a0a0" }}>customer_id</span>
                      <span style={{ border: "1px solid #ff2a1a", color: "#ff2a1a", fontSize: "8px", padding: "0px 3px", borderRadius: "2px" }}>FK</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#a0a0a0" }}>product_id</span>
                      <span style={{ border: "1px solid #ff2a1a", color: "#ff2a1a", fontSize: "8px", padding: "0px 3px", borderRadius: "2px" }}>FK</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#888888" }}>order_date</span>
                      <span style={{ color: "#555555" }}>date</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#888888" }}>total</span>
                      <span style={{ color: "#555555" }}>decimal</span>
                    </div>
                  </div>
                </div>

                {/* Table Card 3: products */}
                <div
                  style={{
                    position: "absolute",
                    top: "20px",
                    right: "24px",
                    width: "150px",
                    backgroundColor: "#111111",
                    border: "1px solid #222222",
                    borderRadius: "4px",
                    zIndex: 2,
                    fontFamily: "var(--cd-font-mono)",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.5)",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 10px",
                      borderBottom: "1px solid #1c1c1c",
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#ffffff",
                    }}
                  >
                    <span>products</span>
                    <span style={{ color: "#555555", fontSize: "9px" }}>TABLE</span>
                  </div>
                  <div style={{ padding: "8px 10px", fontSize: "11px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#ffffff" }}>product_id</span>
                      <span style={{ backgroundColor: "#ff2a1a", color: "#fff", fontSize: "9px", padding: "1px 4px", borderRadius: "2px" }}>PK</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#888888" }}>name</span>
                      <span style={{ color: "#555555" }}>text</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#888888" }}>category</span>
                      <span style={{ color: "#555555" }}>enum</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#888888" }}>price</span>
                      <span style={{ color: "#555555" }}>decimal</span>
                    </div>
                  </div>
                </div>

                {/* Table Card 4: payments */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "20px",
                    right: "24px",
                    width: "150px",
                    backgroundColor: "#111111",
                    border: "1px solid #222222",
                    borderRadius: "4px",
                    zIndex: 2,
                    fontFamily: "var(--cd-font-mono)",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.5)",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 10px",
                      borderBottom: "1px solid #1c1c1c",
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#ffffff",
                    }}
                  >
                    <span>payments</span>
                    <span style={{ color: "#555555", fontSize: "9px" }}>TABLE</span>
                  </div>
                  <div style={{ padding: "8px 10px", fontSize: "11px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#ffffff" }}>payment_id</span>
                      <span style={{ backgroundColor: "#ff2a1a", color: "#fff", fontSize: "9px", padding: "1px 4px", borderRadius: "2px" }}>PK</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#a0a0a0" }}>order_id</span>
                      <span style={{ border: "1px solid #ff2a1a", color: "#ff2a1a", fontSize: "8px", padding: "0px 3px", borderRadius: "2px" }}>FK</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#888888" }}>method</span>
                      <span style={{ color: "#555555" }}>enum</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#888888" }}>amount</span>
                      <span style={{ color: "#555555" }}>decimal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 03: DOCUMENT GENERATOR SHOWCASE                                      */}
          {/* ========================================================================= */}
          {activeTab === "03" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.35fr",
                gap: "48px",
                alignItems: "center",
              }}
              className="feature-inner-grid"
            >
              <div>
                <div
                  style={{
                    fontFamily: "var(--cd-font-mono)",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    color: "#ff2a1a",
                    marginBottom: "16px",
                  }}
                >
                  03 — DOCUMENT GENERATOR
                </div>
                <h3
                  style={{
                    fontSize: "clamp(36px, 4.5vw, 56px)",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: "#ffffff",
                    lineHeight: 1.1,
                    marginBottom: "24px",
                  }}
                >
                  Document
                  <br />
                  Generator
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.65,
                    color: "#a0a0a0",
                    marginBottom: "28px",
                  }}
                >
                  Create realistic synthetic documents for testing AI pipelines,
                  document-processing systems, search systems, and enterprise workflows.
                </p>

                {/* Formats */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "32px" }}>
                  {["PDF", "DOCX", "JSON", "TEXT"].map((fmt) => (
                    <span
                      key={fmt}
                      style={{
                        fontFamily: "var(--cd-font-mono)",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        padding: "5px 12px",
                        borderRadius: "2px",
                        border: fmt === "PDF" ? "1px solid #ff2a1a" : "1px solid #222222",
                        color: fmt === "PDF" ? "#ff2a1a" : "#777777",
                        backgroundColor: fmt === "PDF" ? "#140807" : "#0d0d0d",
                      }}
                    >
                      {fmt}
                    </span>
                  ))}
                </div>

                <button
                  onClick={onOpenWorkspace}
                  style={{
                    backgroundColor: "#ff2a1a",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Generate Synthetic Documents →
                </button>
              </div>

              {/* Realistic Document Preview Card */}
              <div
                style={{
                  backgroundColor: "#0d0d0d",
                  border: "1px solid #222222",
                  borderRadius: "4px",
                  padding: "24px",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
                  fontFamily: "var(--cd-font-sans)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #1f1f1f",
                    paddingBottom: "14px",
                    marginBottom: "18px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11px", fontFamily: "var(--cd-font-mono)", color: "#ff2a1a" }}>
                      ■ CLOAKDATA SYNTHESIS ENGINE
                    </span>
                    <h4 style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff", marginTop: "2px" }}>
                      CUSTOMER AUDIT & STATEMENT
                    </h4>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--cd-font-mono)",
                      fontSize: "10px",
                      color: "#10b981",
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      padding: "3px 8px",
                      borderRadius: "2px",
                    }}
                  >
                    RECONCILED
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                    fontSize: "12px",
                    marginBottom: "18px",
                  }}
                >
                  <div>
                    <span style={{ color: "#666666" }}>Customer ID:</span>
                    <div style={{ color: "#ffffff", fontWeight: 600, fontFamily: "var(--cd-font-mono)" }}>
                      CUST-PK-98402
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "#666666" }}>Account Type:</span>
                    <div style={{ color: "#ffffff", fontWeight: 600 }}>Commercial Platinum</div>
                  </div>
                  <div>
                    <span style={{ color: "#666666" }}>Customer Name:</span>
                    <div style={{ color: "#ffffff", fontWeight: 600 }}>Tariq Mansoor</div>
                  </div>
                  <div>
                    <span style={{ color: "#666666" }}>Billing City:</span>
                    <div style={{ color: "#ffffff", fontWeight: 600 }}>Lahore, Pakistan</div>
                  </div>
                </div>

                {/* Ledger Item Preview */}
                <div
                  style={{
                    backgroundColor: "#121212",
                    borderRadius: "4px",
                    padding: "12px",
                    fontFamily: "var(--cd-font-mono)",
                    fontSize: "11px",
                    border: "1px solid #1c1c1c",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#666666", marginBottom: "6px" }}>
                    <span>TRANSACTION</span>
                    <span>AMOUNT</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#f0f0f0", marginBottom: "4px" }}>
                    <span>TX-88219 Merchant Settlement</span>
                    <span style={{ color: "#10b981" }}>+ $4,200.00</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#f0f0f0", marginBottom: "4px" }}>
                    <span>TX-88220 Cloud Infra API Tier</span>
                    <span style={{ color: "#ff2a1a" }}>- $380.00</span>
                  </div>
                  <div style={{ borderTop: "1px solid #222222", marginTop: "8px", paddingTop: "6px", display: "flex", justifyContent: "space-between", color: "#ffffff", fontWeight: 700 }}>
                    <span>Reconciled Balance:</span>
                    <span>$3,820.00</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 04: DATA PROFILER SHOWCASE                                           */}
          {/* ========================================================================= */}
          {activeTab === "04" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.35fr",
                gap: "48px",
                alignItems: "center",
              }}
              className="feature-inner-grid"
            >
              <div>
                <div
                  style={{
                    fontFamily: "var(--cd-font-mono)",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    color: "#ff2a1a",
                    marginBottom: "16px",
                  }}
                >
                  04 — DATA PROFILER
                </div>
                <h3
                  style={{
                    fontSize: "clamp(36px, 4.5vw, 56px)",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: "#ffffff",
                    lineHeight: 1.1,
                    marginBottom: "24px",
                  }}
                >
                  Data
                  <br />
                  Profiler
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.65,
                    color: "#a0a0a0",
                    marginBottom: "28px",
                  }}
                >
                  Understand data types, missing values, unique distributions, correlations,
                  and outliers across all synthetic and baseline columns.
                </p>

                <button
                  onClick={onOpenWorkspace}
                  style={{
                    backgroundColor: "#ff2a1a",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Explore Profiler Metrics →
                </button>
              </div>

              {/* Analytical Profiling Dashboard Card */}
              <div
                style={{
                  backgroundColor: "#0d0d0d",
                  border: "1px solid #222222",
                  borderRadius: "4px",
                  padding: "24px",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
                }}
              >
                {/* Metric Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ backgroundColor: "#121212", border: "1px solid #1c1c1c", padding: "14px", borderRadius: "3px" }}>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", fontFamily: "var(--cd-font-mono)" }}>
                      94.8%
                    </div>
                    <div style={{ fontSize: "11px", color: "#888888", marginTop: "4px" }}>
                      Distribution Similarity
                    </div>
                  </div>
                  <div style={{ backgroundColor: "#121212", border: "1px solid #1c1c1c", padding: "14px", borderRadius: "3px" }}>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", fontFamily: "var(--cd-font-mono)" }}>
                      98.2%
                    </div>
                    <div style={{ fontSize: "11px", color: "#888888", marginTop: "4px" }}>
                      Schema Coverage
                    </div>
                  </div>
                  <div style={{ backgroundColor: "#121212", border: "1px solid #1c1c1c", padding: "14px", borderRadius: "3px" }}>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#ff2a1a", fontFamily: "var(--cd-font-mono)" }}>
                      7.4M
                    </div>
                    <div style={{ fontSize: "11px", color: "#888888", marginTop: "4px" }}>
                      Generated Records
                    </div>
                  </div>
                </div>

                {/* Histogram Visual Fragment */}
                <div style={{ backgroundColor: "#121212", padding: "14px", borderRadius: "3px", border: "1px solid #1c1c1c" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "var(--cd-font-mono)", color: "#888888", marginBottom: "12px" }}>
                    <span>NUMERICAL DISTRIBUTION · KS-STATISTIC: 0.042 (P=0.91)</span>
                    <span style={{ color: "#ff2a1a" }}>DEMO UI VALUES</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "64px" }}>
                    {[22, 45, 68, 92, 85, 60, 38, 20, 10, 5].map((val, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: `${val}%`,
                          backgroundColor: i === 3 ? "#ff2a1a" : "#2a2a2a",
                          borderRadius: "1px",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 05: DATA TESTER SHOWCASE                                             */}
          {/* ========================================================================= */}
          {activeTab === "05" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.35fr",
                gap: "48px",
                alignItems: "center",
              }}
              className="feature-inner-grid"
            >
              <div>
                <div
                  style={{
                    fontFamily: "var(--cd-font-mono)",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    color: "#ff2a1a",
                    marginBottom: "16px",
                  }}
                >
                  05 — DATA TESTER
                </div>
                <h3
                  style={{
                    fontSize: "clamp(36px, 4.5vw, 56px)",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: "#ffffff",
                    lineHeight: 1.1,
                    marginBottom: "24px",
                  }}
                >
                  Data
                  <br />
                  Tester
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.65,
                    color: "#a0a0a0",
                    marginBottom: "28px",
                  }}
                >
                  Execute automated verification suites: schema checks, null constraints,
                  duplicate isolation, distribution divergence, and mathematical integrity.
                </p>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={handleRunTests}
                    disabled={runningTests}
                    style={{
                      backgroundColor: "#ff2a1a",
                      color: "#ffffff",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {runningTests ? (
                      <>
                        <span className="animate-spin">⟳</span> Running Test Suite...
                      </>
                    ) : (
                      <>
                        <span>▶</span> Run Live Test Suite
                      </>
                    )}
                  </button>

                  <button
                    onClick={onOpenWorkspace}
                    style={{
                      backgroundColor: "#111111",
                      color: "#ffffff",
                      border: "1px solid #333333",
                      padding: "10px 18px",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    Open Tester View →
                  </button>
                </div>
              </div>

              {/* Tester Dashboard Card */}
              <div
                style={{
                  backgroundColor: "#0d0d0d",
                  border: "1px solid #222222",
                  borderRadius: "4px",
                  padding: "24px",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
                }}
              >
                {/* Score Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #1c1c1c",
                    paddingBottom: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11px", fontFamily: "var(--cd-font-mono)", color: "#888888" }}>
                      AUTOMATED VALIDATION ENGINE
                    </span>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", fontFamily: "var(--cd-font-mono)" }}>
                      96.4%
                    </div>
                    <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}>
                      ✓ DATA QUALITY SCORE (PASSED)
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--cd-font-mono)",
                      fontSize: "10px",
                      color: "#666666",
                    }}
                  >
                    DEMO UI VISUALIZATION
                  </span>
                </div>

                {/* Test Check Items */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { name: "Schema validation", note: "100% matched target spec", status: "PASSED" },
                    { name: "Null-value checks", note: "Null rate within 2.0% tolerance", status: "PASSED" },
                    { name: "Duplicate detection", note: "Zero duplicate primary keys found", status: "PASSED" },
                    { name: "Constraint validation", note: "All cross-table foreign keys valid (0 orphans)", status: "PASSED" },
                    { name: "Distribution validation", note: "Wasserstein metric p > 0.05", status: "PASSED" },
                  ].map((chk, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "#121212",
                        padding: "10px 14px",
                        borderRadius: "3px",
                        fontSize: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ color: "#10b981", fontWeight: 800 }}>✓</span>
                        <span style={{ color: "#ffffff", fontWeight: 600 }}>{chk.name}</span>
                        <span style={{ color: "#666666", fontSize: "11px" }}>({chk.note})</span>
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--cd-font-mono)",
                          fontSize: "10px",
                          color: "#10b981",
                          fontWeight: 700,
                        }}
                      >
                        {chk.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .features-header-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .feature-inner-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .feature-canvas-card {
            padding: 24px !important;
          }
        }
      `}</style>
    </section>
  );
}
