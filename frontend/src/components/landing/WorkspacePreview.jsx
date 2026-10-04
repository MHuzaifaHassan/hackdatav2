import React from "react";
import CloakLogo from "./CloakLogo";

export default function WorkspacePreview({ onEnterWorkspace }) {
  return (
    <section
      id="workspace-preview"
      style={{
        backgroundColor: "#050505",
        borderBottom: "1px solid var(--cd-border-subtle)",
        padding: "100px 0 120px 0",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "0 24px" }}>
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "48px",
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--cd-font-mono)",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: "#ff2a1a",
                marginBottom: "12px",
              }}
            >
              MISSION CONTROL
            </div>
            <h2
              style={{
                fontSize: "clamp(38px, 5vw, 68px)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                color: "#ffffff",
                marginBottom: "16px",
              }}
            >
              Your synthetic <span style={{ color: "#ff2a1a" }}>data workspace.</span>
            </h2>
            <p
              style={{
                fontSize: "17px",
                lineHeight: 1.6,
                color: "#a0a0a0",
                maxWidth: "580px",
              }}
            >
              A unified engineering environment for generating datasets, modeling multi-table
              schemas, profiling fidelity, and running adversarial test suites.
            </p>
          </div>

          <button
            onClick={onEnterWorkspace}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "#ff2a1a",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              padding: "16px 32px",
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "0.02em",
              cursor: "pointer",
              boxShadow: "0 4px 28px rgba(255, 42, 26, 0.35)",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e9271a";
              e.currentTarget.style.boxShadow = "0 8px 36px rgba(255, 42, 26, 0.5)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ff2a1a";
              e.currentTarget.style.boxShadow = "0 4px 28px rgba(255, 42, 26, 0.35)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span>Enter Workspace</span>
            <span style={{ fontSize: "18px" }}>→</span>
          </button>
        </div>

        {/* Realistic High-Fidelity Workspace Interface Mockup */}
        <div
          onClick={onEnterWorkspace}
          style={{
            backgroundColor: "#0a0a0a",
            border: "1px solid #222222",
            borderRadius: "6px",
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(0,0,0,0.85), 0 0 1px rgba(255,42,26,0.2)",
            display: "grid",
            gridTemplateColumns: "240px 1fr",
            minHeight: "560px",
            cursor: "pointer",
            position: "relative",
            transition: "border-color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255, 42, 26, 0.4)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#222222")}
        >
          {/* Overlay Click Prompt */}
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "20px",
              zIndex: 10,
              backgroundColor: "rgba(255, 42, 26, 0.15)",
              border: "1px solid rgba(255, 42, 26, 0.5)",
              padding: "6px 14px",
              borderRadius: "4px",
              fontFamily: "var(--cd-font-mono)",
              fontSize: "11px",
              color: "#ff2a1a",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>● LIVE WORKSPACE AVAILABLE</span>
            <span>— CLICK TO LAUNCH</span>
          </div>

          {/* Mockup Left Sidebar */}
          <div
            style={{
              backgroundColor: "#0d0d0d",
              borderRight: "1px solid #1a1a1a",
              padding: "20px 16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              {/* Sidebar Brand */}
              <div style={{ paddingBottom: "18px", borderBottom: "1px solid #1a1a1a", marginBottom: "18px" }}>
                <CloakLogo size={22} wordmarkSize="15px" />
                <div style={{ fontSize: "10px", fontFamily: "var(--cd-font-mono)", color: "#666666", marginTop: "4px" }}>
                  WORKSPACE v2.4
                </div>
              </div>

              {/* Sidebar Nav Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div
                  style={{
                    backgroundColor: "#161616",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                    padding: "8px 12px",
                    borderRadius: "3px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ color: "#ff2a1a", fontSize: "10px" }}>■</span>
                  <span>Dashboard</span>
                </div>

                <div style={{ fontSize: "10px", fontFamily: "var(--cd-font-mono)", color: "#555555", padding: "12px 12px 4px 12px", letterSpacing: "0.1em" }}>
                  GENERATE
                </div>
                <div style={{ color: "#888888", fontSize: "13px", padding: "6px 12px" }}>Tabular Engine</div>
                <div style={{ color: "#888888", fontSize: "13px", padding: "6px 12px" }}>Relational DAG</div>
                <div style={{ color: "#888888", fontSize: "13px", padding: "6px 12px" }}>Document Suite</div>

                <div style={{ fontSize: "10px", fontFamily: "var(--cd-font-mono)", color: "#555555", padding: "12px 12px 4px 12px", letterSpacing: "0.1em" }}>
                  ANALYZE & TEST
                </div>
                <div style={{ color: "#888888", fontSize: "13px", padding: "6px 12px" }}>Data Profiler</div>
                <div style={{ color: "#888888", fontSize: "13px", padding: "6px 12px" }}>TSTR Benchmark</div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "14px" }}>
              <div style={{ fontSize: "11px", color: "#666666", fontFamily: "var(--cd-font-mono)" }}>
                ENVIRONMENT: LOCAL (8000)
              </div>
              <div style={{ fontSize: "11px", color: "#10b981", marginTop: "2px" }}>
                ● ENGINE CONNECTED
              </div>
            </div>
          </div>

          {/* Mockup Main Workspace Area */}
          <div style={{ padding: "28px", backgroundColor: "#080808" }}>
            {/* Top Workspace Breadcrumb & Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>
                  Workspace Overview
                </h3>
                <span style={{ fontSize: "12px", color: "#666666" }}>
                  Production Pipeline: Active / Seeding mode determinism enabled
                </span>
              </div>
            </div>

            {/* 4 Metric Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "14px",
                marginBottom: "24px",
              }}
            >
              {[
                { label: "Active Datasets", val: "12", sub: "3 multi-table DAGs", color: "#ffffff" },
                { label: "Generated Records", val: "1.42M", sub: "Zero orphan keys", color: "#ff2a1a" },
                { label: "Avg Quality Score", val: "97.1%", sub: "TSTR benchmarked", color: "#10b981" },
                { label: "Privacy Metric", val: "100%", sub: "0 raw row overlaps", color: "#ffffff" },
              ].map((card, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#0f0f0f",
                    border: "1px solid #1a1a1a",
                    padding: "16px",
                    borderRadius: "3px",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#777777", marginBottom: "6px" }}>{card.label}</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: card.color, fontFamily: "var(--cd-font-mono)" }}>
                    {card.val}
                  </div>
                  <div style={{ fontSize: "11px", color: "#555555", marginTop: "4px" }}>{card.sub}</div>
                </div>
              ))}
            </div>

            {/* Mockup Table View */}
            <div
              style={{
                backgroundColor: "#0d0d0d",
                border: "1px solid #1c1c1c",
                borderRadius: "3px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  fontFamily: "var(--cd-font-mono)",
                  borderBottom: "1px solid #1a1a1a",
                  paddingBottom: "10px",
                  marginBottom: "12px",
                }}
              >
                <span style={{ color: "#ffffff", fontWeight: 600 }}>
                  ACTIVE GENERATION QUEUE: FINTECH BANKING RELATIONAL
                </span>
                <span style={{ color: "#10b981" }}>SYNCHRONIZED (100% RELATIONAL FIDELITY)</span>
              </div>

              {/* Snippet Row */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", fontFamily: "var(--cd-font-mono)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#888888", backgroundColor: "#121212", padding: "8px 12px", borderRadius: "2px" }}>
                  <span>Table: `customers` (5,000 rows)</span>
                  <span style={{ color: "#ff2a1a" }}>PK: customer_id (UUID)</span>
                  <span style={{ color: "#10b981" }}>Temporal valid</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#888888", backgroundColor: "#121212", padding: "8px 12px", borderRadius: "2px" }}>
                  <span>Table: `accounts` (8,500 rows)</span>
                  <span style={{ color: "#ff2a1a" }}>FK: customer_id -&gt; customers</span>
                  <span style={{ color: "#10b981" }}>0 Orphan FKs</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#888888", backgroundColor: "#121212", padding: "8px 12px", borderRadius: "2px" }}>
                  <span>Table: `transactions` (45,000 rows)</span>
                  <span style={{ color: "#ff2a1a" }}>FK: account_id -&gt; accounts</span>
                  <span style={{ color: "#10b981" }}>Reconciled balances</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
