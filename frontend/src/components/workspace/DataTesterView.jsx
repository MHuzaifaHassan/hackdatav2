import React, { useState } from "react";
import { downloadAndOpenFile, downloadJson } from "./fileDownload";

const API_BASE = "http://127.0.0.1:8000";

export default function DataTesterView({ showNotification }) {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState("12S");
  const [score, setScore] = useState("96.4%");

  const [tests, setTests] = useState([
    {
      test: "Schema",
      scope: "4 tables",
      rule: "types & columns match config",
      result: "28 / 28",
      status: "PASSED",
    },
    {
      test: "Nulls",
      scope: "non-nullable fields",
      rule: "0 unexpected nulls",
      result: "0",
      status: "PASSED",
    },
    {
      test: "Duplicates",
      scope: "primary keys",
      rule: "all PKs unique",
      result: "0 dupes",
      status: "PASSED",
    },
    {
      test: "Constraints",
      scope: "payments.amount",
      rule: "= orders.total",
      result: "12 mismatches",
      status: "FAILED",
    },
    {
      test: "Distribution",
      scope: "orders.total",
      rule: "KS distance < 0.05",
      result: "0.061",
      status: "WARNING",
    },
    {
      test: "Quality",
      scope: "dataset",
      rule: "score ≥ 90%",
      result: "96.4%",
      status: "PASSED",
    },
  ]);

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setLastRun("JUST NOW");
      setScore("97.8%");
      setTests([
        {
          test: "Schema",
          scope: "4 tables",
          rule: "types & columns match config",
          result: "28 / 28",
          status: "PASSED",
        },
        {
          test: "Nulls",
          scope: "non-nullable fields",
          rule: "0 unexpected nulls",
          result: "0",
          status: "PASSED",
        },
        {
          test: "Duplicates",
          scope: "primary keys",
          rule: "all PKs unique",
          result: "0 dupes",
          status: "PASSED",
        },
        {
          test: "Constraints",
          scope: "payments.amount",
          rule: "= orders.total",
          result: "0 mismatches",
          status: "PASSED",
        },
        {
          test: "Distribution",
          scope: "orders.total",
          rule: "KS distance < 0.05",
          result: "0.042",
          status: "PASSED",
        },
        {
          test: "Quality",
          scope: "dataset",
          rule: "score ≥ 90%",
          result: "97.8%",
          status: "PASSED",
        },
      ]);
      if (showNotification) {
        showNotification("Test suite executed: 6 of 6 checks verified!");
      }
    }, 800);
  };

  const handleExportReport = async () => {
    const reportData = {
      score,
      tests,
      timestamp: new Date().toISOString(),
      engine: "CLOAKDATA TSTR Validation Engine",
    };

    try {
      const res = await fetch(`${API_BASE}/evaluation/report-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report: {
            overall_quality_score: 97.8,
            utility: { tstr_accuracy: 0.94, trtr_accuracy: 0.96, utility_ratio: 0.98 },
            fidelity: { ks_statistic: 0.042, p_value: 0.91, jensen_shannon_divergence: 0.02 },
            privacy: { exact_matches_count: 0, privacy_risk_score: 0.0 },
          },
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        downloadAndOpenFile(blob, "CLOAKDATA_Data_Tester_Report.pdf", "application/pdf");
        if (showNotification) showNotification("Downloaded & opened Data Tester PDF Report");
        return;
      }
    } catch (e) {
      // Fallback
    }

    downloadJson(reportData, "CLOAKDATA_Data_Tester_Report.json");
    if (showNotification) showNotification("Downloaded & opened Data Tester Report JSON");
  };

  const passedCount = tests.filter((t) => t.status === "PASSED").length;
  const warningCount = tests.filter((t) => t.status === "WARNING").length;
  const failedCount = tests.filter((t) => t.status === "FAILED").length;

  return (
    <div style={{ color: "#ffffff", padding: "8px 0" }}>
      {/* Top Header (Exact Screenshot 1 Replica) */}
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
            VALIDATE / TESTER · retail_db
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", color: "#ffffff" }}>
            Data Tester
          </h2>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={handleExportReport}
            style={{
              backgroundColor: "#111111",
              border: "1px solid #282828",
              color: "#cccccc",
              padding: "8px 18px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Export Report
          </button>

          <button
            onClick={handleRunTests}
            disabled={isRunning}
            style={{
              backgroundColor: "#ff2a1a",
              color: "#ffffff",
              border: "none",
              padding: "8px 22px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 14px rgba(255, 42, 26, 0.35)",
            }}
          >
            {isRunning ? <span className="animate-spin">⟳</span> : <span>▶</span>}
            <span>Run Tests</span>
          </button>
        </div>
      </div>

      {/* 4 Top KPI Cards (Exact Screenshot 1 Replica) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
          gap: "16px",
          marginBottom: "28px",
        }}
        className="tester-cards-grid"
      >
        {/* Card 1: Data Quality Score */}
        <div
          style={{
            backgroundColor: "#0d0d0d",
            border: "1px solid #1c1c1c",
            borderRadius: "4px",
            padding: "20px 24px",
          }}
        >
          <div style={{ fontSize: "11px", color: "#666666", marginBottom: "8px" }}>
            Data Quality Score · demo
          </div>
          <div
            style={{
              fontSize: "36px",
              fontWeight: 900,
              color: "#ffffff",
              fontFamily: "var(--cd-font-mono)",
              letterSpacing: "-0.02em",
            }}
          >
            {score}
          </div>
        </div>

        {/* Card 2: Passed (Green) */}
        <div
          style={{
            backgroundColor: "#0d0d0d",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "4px",
            padding: "20px 24px",
          }}
        >
          <div style={{ fontSize: "11px", color: "#666666", marginBottom: "8px" }}>Passed</div>
          <div
            style={{
              fontSize: "36px",
              fontWeight: 900,
              color: "#10b981",
              fontFamily: "var(--cd-font-mono)",
            }}
          >
            {passedCount}
          </div>
        </div>

        {/* Card 3: Warnings (Amber) */}
        <div
          style={{
            backgroundColor: "#0d0d0d",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "4px",
            padding: "20px 24px",
          }}
        >
          <div style={{ fontSize: "11px", color: "#666666", marginBottom: "8px" }}>Warnings</div>
          <div
            style={{
              fontSize: "36px",
              fontWeight: 900,
              color: "#f59e0b",
              fontFamily: "var(--cd-font-mono)",
            }}
          >
            {warningCount}
          </div>
        </div>

        {/* Card 4: Failed (Red) */}
        <div
          style={{
            backgroundColor: "#0d0d0d",
            border: "1px solid rgba(255, 42, 26, 0.4)",
            borderRadius: "4px",
            padding: "20px 24px",
          }}
        >
          <div style={{ fontSize: "11px", color: "#666666", marginBottom: "8px" }}>Failed</div>
          <div
            style={{
              fontSize: "36px",
              fontWeight: 900,
              color: "#ff2a1a",
              fontFamily: "var(--cd-font-mono)",
            }}
          >
            {failedCount}
          </div>
        </div>
      </div>

      {/* Test Suite Table (Exact Screenshot 1 Replica) */}
      <div
        style={{
          backgroundColor: "#0d0d0d",
          border: "1px solid #1c1c1c",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        {/* Table Top Bar */}
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
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>Test suite</span>
          <span style={{ fontSize: "10px", color: "#666666", letterSpacing: "0.1em" }}>
            LAST RUN · {lastRun} · DEMO RESULTS
          </span>
        </div>

        {/* Table Content */}
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
                <th style={{ padding: "12px 20px", fontWeight: 700 }}>TEST</th>
                <th style={{ padding: "12px 20px", fontWeight: 700 }}>SCOPE</th>
                <th style={{ padding: "12px 20px", fontWeight: 700 }}>RULE</th>
                <th style={{ padding: "12px 20px", fontWeight: 700 }}>RESULT</th>
                <th style={{ padding: "12px 20px", fontWeight: 700 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t, idx) => {
                const isPassed = t.status === "PASSED";
                const isWarning = t.status === "WARNING";
                const isFailed = t.status === "FAILED";

                const statusColor = isPassed ? "#10b981" : isWarning ? "#f59e0b" : "#ff2a1a";
                const statusBorder = isPassed
                  ? "rgba(16, 185, 129, 0.4)"
                  : isWarning
                  ? "rgba(245, 158, 11, 0.4)"
                  : "rgba(255, 42, 26, 0.4)";
                const statusBg = isPassed
                  ? "rgba(16, 185, 129, 0.08)"
                  : isWarning
                  ? "rgba(245, 158, 11, 0.08)"
                  : "rgba(255, 42, 26, 0.08)";

                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid #141414",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#121212")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "14px 20px", color: "#ffffff", fontWeight: 700 }}>{t.test}</td>
                    <td style={{ padding: "14px 20px", color: "#888888" }}>{t.scope}</td>
                    <td style={{ padding: "14px 20px", color: "#888888" }}>{t.rule}</td>
                    <td style={{ padding: "14px 20px", color: isFailed ? "#ff2a1a" : isWarning ? "#f59e0b" : "#ffffff", fontWeight: 600 }}>
                      {t.result}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "3px 8px",
                          borderRadius: "2px",
                          border: `1px solid ${statusBorder}`,
                          backgroundColor: statusBg,
                          color: statusColor,
                          fontSize: "10px",
                          fontWeight: 700,
                        }}
                      >
                        <span>●</span>
                        <span>{t.status}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .tester-cards-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
