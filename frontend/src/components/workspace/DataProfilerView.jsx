import React, { useState } from "react";

export default function DataProfilerView({ showNotification }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [isProfiling, setIsProfiling] = useState(false);

  // Dynamic Histogram Data: [synthetic, source]
  const [histogramData, setHistogramData] = useState([
    { syn: 16, src: 12 },
    { syn: 32, src: 28 },
    { syn: 58, src: 52 },
    { syn: 88, src: 84 },
    { syn: 96, src: 92 },
    { syn: 78, src: 72 },
    { syn: 52, src: 48 },
    { syn: 28, src: 24 },
    { syn: 14, src: 18 },
  ]);

  // Dynamic Correlation Heatmap values (5x5 matrix opacity)
  const [corrMatrix, setCorrMatrix] = useState([
    [1.0, 0.22, 0.05, 0.45, 0.12],
    [0.22, 1.0, 0.14, 0.74, 0.31],
    [0.05, 0.14, 1.0, 0.08, 0.62],
    [0.45, 0.74, 0.08, 1.0, 0.28],
    [0.12, 0.31, 0.62, 0.28, 1.0],
  ]);

  // Missing values
  const [missingStats, setMissingStats] = useState({
    customer_id: 0.0,
    age: 0.2,
    city: 1.4,
    income: 0.3,
  });

  const handleRunProfile = () => {
    setIsProfiling(true);
    setTimeout(() => {
      // Animate histogram bars with new realistic values
      setHistogramData([
        { syn: 14 + Math.floor(Math.random() * 8), src: 12 + Math.floor(Math.random() * 6) },
        { syn: 30 + Math.floor(Math.random() * 10), src: 26 + Math.floor(Math.random() * 8) },
        { syn: 54 + Math.floor(Math.random() * 12), src: 50 + Math.floor(Math.random() * 10) },
        { syn: 82 + Math.floor(Math.random() * 14), src: 80 + Math.floor(Math.random() * 12) },
        { syn: 92 + Math.floor(Math.random() * 8), src: 90 + Math.floor(Math.random() * 8) },
        { syn: 72 + Math.floor(Math.random() * 12), src: 70 + Math.floor(Math.random() * 10) },
        { syn: 48 + Math.floor(Math.random() * 10), src: 46 + Math.floor(Math.random() * 8) },
        { syn: 24 + Math.floor(Math.random() * 8), src: 22 + Math.floor(Math.random() * 6) },
        { syn: 12 + Math.floor(Math.random() * 6), src: 16 + Math.floor(Math.random() * 6) },
      ]);

      // Shuffle slight correlations
      setCorrMatrix([
        [1.0, 0.2 + Math.random() * 0.1, 0.05, 0.4 + Math.random() * 0.1, 0.1],
        [0.2 + Math.random() * 0.1, 1.0, 0.12, 0.7 + Math.random() * 0.08, 0.3],
        [0.05, 0.12, 1.0, 0.07, 0.6],
        [0.4 + Math.random() * 0.1, 0.7 + Math.random() * 0.08, 0.07, 1.0, 0.25],
        [0.1, 0.3, 0.6, 0.25, 1.0],
      ]);

      setIsProfiling(false);
      if (showNotification) {
        showNotification("Data profiling complete: 94.8% distribution similarity verified.");
      }
    }, 600);
  };

  return (
    <div style={{ color: "#ffffff", padding: "8px 0" }}>
      {/* Top Header (Exact Screenshot 2 Replica) */}
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
            ANALYZE / PROFILER · customers_synthetic
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", color: "#ffffff" }}>
            Data Profiler
          </h2>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => showNotification && showNotification("Source dataset baseline mapped.")}
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
            Compare with source
          </button>

          <button
            onClick={handleRunProfile}
            disabled={isProfiling}
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
            {isProfiling && <span className="animate-spin">⟳</span>}
            <span>Run Profile</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation (Exact Screenshot 2 Replica) */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          borderBottom: "1px solid #1a1a1a",
          paddingBottom: "10px",
          marginBottom: "24px",
          overflowX: "auto",
        }}
      >
        {["Overview", "Schema", "Statistics", "Distributions", "Missing Values", "Correlations", "Outliers"].map(
          (tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: "none",
                  border: "none",
                  color: isActive ? "#ffffff" : "#666666",
                  fontSize: "13px",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  position: "relative",
                  padding: "4px 0",
                  whiteSpace: "nowrap",
                }}
              >
                {tab}
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-11px",
                      left: 0,
                      right: 0,
                      height: "2px",
                      backgroundColor: "#ff2a1a",
                    }}
                  />
                )}
              </button>
            );
          }
        )}
      </div>

      {/* Metrics Row (5 Cards - Exact Screenshot 2 Replica) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
        className="profiler-metrics-grid"
      >
        {[
          { label: "Rows", val: "250,000", color: "#ffffff" },
          { label: "Columns", val: "5", color: "#ffffff" },
          { label: "Missing values", val: "0.4%", color: "#ffffff" },
          { label: "Distribution similarity", val: "94.8%", color: "#ff2a1a" },
          { label: "Outliers", val: "23", color: "#ffffff" },
        ].map((m, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "#0d0d0d",
              border: "1px solid #1c1c1c",
              borderRadius: "4px",
              padding: "18px 20px",
            }}
          >
            <div style={{ fontSize: "11px", color: "#666666", marginBottom: "8px" }}>{m.label}</div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: m.color,
                fontFamily: "var(--cd-font-mono)",
                letterSpacing: "-0.02em",
              }}
            >
              {m.val}
            </div>
          </div>
        ))}
      </div>

      {/* 3 Visual Dashboard Panels: Distribution + Correlations + Missing Values */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr",
          gap: "16px",
          marginBottom: "28px",
        }}
        className="profiler-visual-grid"
      >
        {/* Panel 1: Distribution - Income with Moving Bars (Exact Screenshot 2 Replica) */}
        <div
          style={{
            backgroundColor: "#0d0d0d",
            border: "1px solid #1c1c1c",
            borderRadius: "4px",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              fontFamily: "var(--cd-font-mono)",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff" }}>Distribution - Income</span>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "10px" }}>
              <span style={{ color: "#ff2a1a", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "8px" }}>■</span> SYNTHETIC
              </span>
              <span style={{ color: "#666666", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "8px" }}>■</span> SOURCE
              </span>
            </div>
          </div>

          {/* Animated Histogram Bars */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "8px",
              height: "140px",
              paddingTop: "10px",
              borderBottom: "1px solid #1a1a1a",
              paddingBottom: "4px",
            }}
          >
            {histogramData.map((d, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  gap: "2px",
                  alignItems: "flex-end",
                  height: "100%",
                }}
              >
                {/* Source Bar (Gray) */}
                <div
                  style={{
                    width: "50%",
                    height: `${d.src}%`,
                    backgroundColor: "#333333",
                    borderRadius: "1px 1px 0 0",
                    transition: "height 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
                {/* Synthetic Bar (Red) */}
                <div
                  style={{
                    width: "50%",
                    height: `${d.syn}%`,
                    backgroundColor: "#ff2a1a",
                    borderRadius: "1px 1px 0 0",
                    transition: "height 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Correlations (PEARSON) Heatmap (Exact Screenshot 2 Replica) */}
        <div
          style={{
            backgroundColor: "#0d0d0d",
            border: "1px solid #1c1c1c",
            borderRadius: "4px",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              fontFamily: "var(--cd-font-mono)",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff" }}>Correlations</span>
            <span style={{ fontSize: "10px", color: "#666666" }}>PEARSON</span>
          </div>

          {/* 5x5 Heatmap Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "4px",
              maxWidth: "160px",
              margin: "0 auto",
            }}
          >
            {corrMatrix.flat().map((val, idx) => {
              // Higher correlation = brighter red
              const intensity = Math.min(1, Math.max(0.1, val));
              return (
                <div
                  key={idx}
                  title={`Correlation: ${(val * 1.0).toFixed(2)}`}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "2px",
                    backgroundColor: `rgba(255, 42, 26, ${intensity})`,
                    border: "1px solid #181818",
                    transition: "all 0.3s ease",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Panel 3: Missing values (PER COLUMN) with red bars (Exact Screenshot 2 Replica) */}
        <div
          style={{
            backgroundColor: "#0d0d0d",
            border: "1px solid #1c1c1c",
            borderRadius: "4px",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              fontFamily: "var(--cd-font-mono)",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff" }}>Missing values</span>
            <span style={{ fontSize: "10px", color: "#666666" }}>PER COLUMN</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px", fontFamily: "var(--cd-font-mono)" }}>
            {Object.entries(missingStats).map(([col, pct]) => (
              <div key={col}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "#ffffff" }}>{col}</span>
                  <span style={{ color: pct > 0 ? "#ff2a1a" : "#666666" }}>{pct}%</span>
                </div>
                <div style={{ width: "100%", height: "4px", backgroundColor: "#181818", borderRadius: "2px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min(100, pct * 40)}%`,
                      height: "100%",
                      backgroundColor: "#ff2a1a",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Table: Schema & statistics (Exact Screenshot 2 Replica) */}
      <div
        style={{
          backgroundColor: "#0d0d0d",
          border: "1px solid #1c1c1c",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #1a1a1a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "var(--cd-font-mono)",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>Schema & statistics</span>
          <span style={{ fontSize: "10px", color: "#666666" }}>DEMO VALUES</span>
        </div>

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
                <th style={{ padding: "10px 18px", fontWeight: 700 }}>COLUMN</th>
                <th style={{ padding: "10px 18px", fontWeight: 700 }}>TYPE</th>
                <th style={{ padding: "10px 18px", fontWeight: 700 }}>UNIQUE</th>
                <th style={{ padding: "10px 18px", fontWeight: 700 }}>MISSING</th>
                <th style={{ padding: "10px 18px", fontWeight: 700 }}>MEAN</th>
                <th style={{ padding: "10px 18px", fontWeight: 700 }}>MIN / MAX</th>
                <th style={{ padding: "10px 18px", fontWeight: 700 }}>OUTLIERS</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #141414" }}>
                <td style={{ padding: "12px 18px", color: "#ffffff", fontWeight: 600 }}>age</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>integer</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>73</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>0.2%</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>38.4</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>18 / 90</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>4</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #141414" }}>
                <td style={{ padding: "12px 18px", color: "#ffffff", fontWeight: 600 }}>income</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>float</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>248,912</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>0.3%</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>91,480</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>21,300 / 422,000</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>19</td>
              </tr>
              <tr>
                <td style={{ padding: "12px 18px", color: "#ffffff", fontWeight: 600 }}>segment</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>category</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>3</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>0.0%</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>—</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>—</td>
                <td style={{ padding: "12px 18px", color: "#cccccc" }}>0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .profiler-metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .profiler-visual-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
