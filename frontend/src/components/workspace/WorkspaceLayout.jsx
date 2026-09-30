import React, { useState } from "react";
import CloakLogo from "../landing/CloakLogo";
import AIChatWorkspace from "./AIChatWorkspace";
import TabularGeneratorView from "./TabularGeneratorView";
import RelationalGeneratorView from "./RelationalGeneratorView";
import DocumentGeneratorView from "./DocumentGeneratorView";
import DataProfilerView from "./DataProfilerView";
import DataTesterView from "./DataTesterView";
import SqlConsoleModal from "./SqlConsoleModal";
import { IconSearch, IconBell } from "./Icons";

export default function WorkspaceLayout({
  activeView = "ai_chat",
  onNavigateView,
  onReturnToPlatform,
  showNotification,
}) {
  const [currentView, setCurrentView] = useState(activeView);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSqlModal, setShowSqlModal] = useState(false);

  const navSections = [
    {
      heading: "WORKSPACE",
      items: [
        { id: "ai_chat", label: "AI Workspace", badge: "PRIMARY" },
      ],
    },
    {
      heading: "GENERATORS",
      items: [
        { id: "tabular", label: "Tabular Generator" },
        { id: "relational", label: "Relational Generator" },
        { id: "documents", label: "Document Generator" },
      ],
    },
    {
      heading: "ANALYZE & TEST",
      items: [
        { id: "profiler", label: "Data Profiler" },
        { id: "tester", label: "Data Tester" },
      ],
    },
    {
      heading: "EXPLORE",
      items: [
        { id: "overview", label: "Overview" },
        { id: "datasets", label: "Datasets Catalog" },
        { id: "settings", label: "Settings" },
      ],
    },
  ];

  const handleSelectView = (id) => {
    if (id === "sql_modal") {
      setShowSqlModal(true);
      return;
    }
    setCurrentView(id);
    if (onNavigateView) onNavigateView(id);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#050505",
        color: "#ffffff",
        overflow: "hidden",
        fontFamily: "var(--cd-font-sans)",
      }}
    >
      {/* ========================================================================= */}
      {/* 1. SIDEBAR (Exact Screenshot 1-5 Replica)                                  */}
      {/* ========================================================================= */}
      <aside
        style={{
          width: "240px",
          minWidth: "240px",
          backgroundColor: "#080808",
          borderRight: "1px solid #181818",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "24px 0",
          userSelect: "none",
        }}
      >
        <div>
          {/* Logo Brand in Sidebar */}
          <div style={{ padding: "0 24px 28px 24px" }}>
            <CloakLogo size={22} wordmarkSize="15px" />
          </div>

          {/* Navigation Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {navSections.map((sec, sIdx) => (
              <div key={sIdx}>
                {sec.heading && (
                  <div
                    style={{
                      fontFamily: "var(--cd-font-mono)",
                      fontSize: "10px",
                      color: "#444444",
                      letterSpacing: "0.12em",
                      padding: "0 24px",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                    }}
                  >
                    {sec.heading}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {sec.items.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectView(item.id)}
                        style={{
                          padding: "8px 24px",
                          fontSize: "13px",
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? "#ffffff" : "#888888",
                          backgroundColor: isActive ? "#121212" : "transparent",
                          borderLeft: isActive ? "2px solid #ff2a1a" : "2px solid transparent",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.color = "#ffffff";
                            e.currentTarget.style.backgroundColor = "#0d0d0d";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.color = "#888888";
                            e.currentTarget.style.backgroundColor = "transparent";
                          }
                        }}
                      >
                        <span>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer: Back to Platform Website */}
        <div style={{ padding: "0 20px" }}>
          <button
            onClick={onReturnToPlatform}
            style={{
              width: "100%",
              backgroundColor: "#0d0d0d",
              border: "1px solid #222222",
              borderRadius: "4px",
              padding: "10px 14px",
              color: "#aaaaaa",
              fontSize: "11px",
              fontWeight: 600,
              fontFamily: "var(--cd-font-mono)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ff2a1a";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#222222";
              e.currentTarget.style.color = "#aaaaaa";
            }}
          >
            <span>←</span>
            <span>PLATFORM WEBSITE</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE CONTENT AREA                                            */}
      {/* ========================================================================= */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar (Exact Screenshot 1-5 Replica) */}
        <header
          style={{
            height: "64px",
            backgroundColor: "#080808",
            borderBottom: "1px solid #181818",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Search Bar with ⌘K Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "#0f0f0f",
              border: "1px solid #222222",
              borderRadius: "4px",
              padding: "7px 14px",
              width: "360px",
            }}
          >
            <IconSearch size={14} color="#666666" />
            <input
              type="text"
              placeholder="Search datasets, runs, schemas"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                color: "#ffffff",
                fontSize: "12px",
                width: "100%",
                fontFamily: "var(--cd-font-sans)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--cd-font-mono)",
                fontSize: "10px",
                color: "#666666",
                border: "1px solid #282828",
                borderRadius: "3px",
                padding: "2px 5px",
              }}
            >
              ⌘K
            </span>
          </div>

          {/* Right Topbar Elements (Status Badge, Bell, Avatar) */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Quick SQL Editor Button (Screenshot 1 Replica) */}
            <button
              onClick={() => setShowSqlModal(true)}
              title="Open SQL Editor"
              style={{
                backgroundColor: "#111111",
                border: "1.5px solid #56b5b5",
                color: "#56b5b5",
                borderRadius: "4px",
                padding: "6px 14px",
                fontSize: "11px",
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
              <span>SQL EDITOR</span>
            </button>

            {/* Workspace Online Badge (Exact Screenshot Replica) */}
            <div
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "#10b981",
                fontFamily: "var(--cd-font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                padding: "5px 10px",
                borderRadius: "3px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                letterSpacing: "0.08em",
              }}
            >
              <span style={{ fontSize: "8px" }}>●</span>
              <span>WORKSPACE ONLINE</span>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => showNotification && showNotification("All 4 background generation pipelines idle & ready.")}
              style={{
                background: "none",
                border: "none",
                color: "#888888",
                fontSize: "15px",
                cursor: "pointer",
                padding: "4px",
              }}
              title="Notifications"
            >
              <IconBell size={16} color="#888888" />
            </button>

            {/* User Profile Avatar (Exact Screenshot Replica: 'AR') */}
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                backgroundColor: "#1f1f1f",
                border: "1px solid #333333",
                color: "#ffffff",
                fontFamily: "var(--cd-font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              title="Ayesha Raza (Admin)"
            >
              AR
            </div>
          </div>
        </header>

        {/* Dynamic View Container */}
        <div
          style={{
            flex: 1,
            overflowY: currentView === "ai_chat" ? "hidden" : "auto",
            padding: currentView === "ai_chat" ? "0" : "28px 36px",
            height: "calc(100vh - 64px)",
          }}
        >
          {currentView === "ai_chat" && (
            <AIChatWorkspace
              onOpenSqlModal={() => setShowSqlModal(true)}
              showNotification={showNotification}
            />
          )}

          {currentView === "tabular" && (
            <TabularGeneratorView
              onOpenSql={() => setShowSqlModal(true)}
              showNotification={showNotification}
            />
          )}

          {currentView === "relational" && (
            <RelationalGeneratorView
              onOpenSql={() => setShowSqlModal(true)}
              showNotification={showNotification}
            />
          )}

          {currentView === "documents" && (
            <DocumentGeneratorView
              onOpenSql={() => setShowSqlModal(true)}
              showNotification={showNotification}
            />
          )}

          {currentView === "profiler" && (
            <DataProfilerView showNotification={showNotification} />
          )}

          {currentView === "tester" && (
            <DataTesterView showNotification={showNotification} />
          )}

          {currentView === "overview" && (
            <div>
              <div style={{ fontFamily: "var(--cd-font-mono)", fontSize: "11px", color: "#666666", marginBottom: "4px" }}>
                WORKSPACE / OVERVIEW
              </div>
              <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", marginBottom: "24px" }}>
                Mission Control
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
                {[
                  { label: "Active Datasets", val: "14", sub: "3 multi-table DAGs", color: "#ffffff" },
                  { label: "Synthesized Records", val: "1.42M", sub: "Zero orphan keys", color: "#ff2a1a" },
                  { label: "Avg Quality Score", val: "96.4%", sub: "Automated test suite", color: "#10b981" },
                  { label: "Privacy Metric", val: "100%", sub: "0 raw matches", color: "#ffffff" },
                ].map((c, i) => (
                  <div key={i} style={{ backgroundColor: "#0d0d0d", border: "1px solid #1c1c1c", borderRadius: "4px", padding: "20px" }}>
                    <div style={{ fontSize: "11px", color: "#666666", marginBottom: "6px" }}>{c.label}</div>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: c.color, fontFamily: "var(--cd-font-mono)" }}>
                      {c.val}
                    </div>
                    <div style={{ fontSize: "11px", color: "#555555", marginTop: "4px" }}>{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* Quick Launch Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                <div
                  onClick={() => handleSelectView("tabular")}
                  style={{ backgroundColor: "#0d0d0d", border: "1px solid #1c1c1c", borderRadius: "4px", padding: "24px", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#ff2a1a")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1c1c1c")}
                >
                  <span style={{ fontSize: "11px", fontFamily: "var(--cd-font-mono)", color: "#ff2a1a" }}>GENERATE</span>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "8px 0" }}>Tabular Generator →</h3>
                  <p style={{ fontSize: "12px", color: "#888888" }}>Preserve statistical moments & correlations.</p>
                </div>
                <div
                  onClick={() => handleSelectView("relational")}
                  style={{ backgroundColor: "#0d0d0d", border: "1px solid #1c1c1c", borderRadius: "4px", padding: "24px", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#ff2a1a")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1c1c1c")}
                >
                  <span style={{ fontSize: "11px", fontFamily: "var(--cd-font-mono)", color: "#ff2a1a" }}>GENERATE</span>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "8px 0" }}>Relational Database →</h3>
                  <p style={{ fontSize: "12px", color: "#888888" }}>Synthesize DAG schemas with zero orphan keys.</p>
                </div>
                <div
                  onClick={() => handleSelectView("tester")}
                  style={{ backgroundColor: "#0d0d0d", border: "1px solid #1c1c1c", borderRadius: "4px", padding: "24px", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#ff2a1a")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1c1c1c")}
                >
                  <span style={{ fontSize: "11px", fontFamily: "var(--cd-font-mono)", color: "#ff2a1a" }}>VALIDATE</span>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "8px 0" }}>Data Tester Suite →</h3>
                  <p style={{ fontSize: "12px", color: "#888888" }}>Run 6-point verification & quality audit.</p>
                </div>
              </div>
            </div>
          )}

          {currentView === "datasets" && (
            <div>
              <div style={{ fontFamily: "var(--cd-font-mono)", fontSize: "11px", color: "#666666", marginBottom: "4px" }}>
                WORKSPACE / DATASETS
              </div>
              <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", marginBottom: "24px" }}>
                Synthetic Datasets Catalog
              </h2>
              <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #1c1c1c", borderRadius: "4px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--cd-font-mono)", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1c1c1c", color: "#666666" }}>
                      <th style={{ padding: "12px 20px" }}>DATASET</th>
                      <th style={{ padding: "12px 20px" }}>TYPE</th>
                      <th style={{ padding: "12px 20px" }}>ROWS</th>
                      <th style={{ padding: "12px 20px" }}>STATUS</th>
                      <th style={{ padding: "12px 20px" }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "customers_synthetic", type: "Tabular", rows: "250,000", status: "VALIDATED" },
                      { name: "retail_db (orders + payments)", type: "Relational DAG", rows: "500,000", status: "VERIFIED" },
                      { name: "fintech_banking_dag", type: "Relational DAG", rows: "1,200,000", status: "VERIFIED" },
                      { name: "customer_invoices_reconciled", type: "Documents", rows: "5,000", status: "READY" },
                    ].map((d, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #141414" }}>
                        <td style={{ padding: "14px 20px", color: "#ffffff", fontWeight: 700 }}>{d.name}</td>
                        <td style={{ padding: "14px 20px", color: "#888888" }}>{d.type}</td>
                        <td style={{ padding: "14px 20px", color: "#ff2a1a" }}>{d.rows}</td>
                        <td style={{ padding: "14px 20px", color: "#10b981" }}>● {d.status}</td>
                        <td style={{ padding: "14px 20px" }}>
                          <button
                            onClick={() => handleSelectView("tabular")}
                            style={{
                              backgroundColor: "#161616",
                              border: "1px solid #282828",
                              color: "#cccccc",
                              padding: "4px 10px",
                              borderRadius: "3px",
                              cursor: "pointer",
                            }}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentView === "settings" && (
            <div style={{ maxWidth: "680px" }}>
              <div style={{ fontFamily: "var(--cd-font-mono)", fontSize: "11px", color: "#666666", marginBottom: "4px" }}>
                WORKSPACE / SETTINGS
              </div>
              <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", marginBottom: "24px" }}>
                Platform Settings
              </h2>
              <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #1c1c1c", borderRadius: "4px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#666666", fontFamily: "var(--cd-font-mono)", display: "block", marginBottom: "8px" }}>
                    BACKEND ENGINE URL
                  </label>
                  <input
                    type="text"
                    defaultValue="http://127.0.0.1:8000"
                    style={{ width: "100%", padding: "10px", backgroundColor: "#080808", border: "1px solid #282828", color: "#ffffff", fontFamily: "var(--cd-font-mono)", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#666666", fontFamily: "var(--cd-font-mono)", display: "block", marginBottom: "8px" }}>
                    DEFAULT LOCALE & CURRENCY
                  </label>
                  <input
                    type="text"
                    defaultValue="en_US (USD) / en_PK (PKR)"
                    style={{ width: "100%", padding: "10px", backgroundColor: "#080808", border: "1px solid #282828", color: "#ffffff", fontFamily: "var(--cd-font-mono)", fontSize: "13px" }}
                  />
                </div>
                <button
                  onClick={() => showNotification && showNotification("Settings saved successfully")}
                  style={{ alignSelf: "flex-start", backgroundColor: "#ff2a1a", color: "#ffffff", border: "none", padding: "10px 24px", borderRadius: "4px", fontWeight: 700, cursor: "pointer" }}
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* SQL Query Console Modal */}
      <SqlConsoleModal
        isOpen={showSqlModal}
        onClose={() => setShowSqlModal(false)}
        showNotification={showNotification}
      />
    </div>
  );
}
