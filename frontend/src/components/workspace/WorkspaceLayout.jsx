import React, { useState, useMemo } from "react";
import CloakLogo from "../landing/CloakLogo";
import AIChatWorkspace from "./AIChatWorkspace";
import TabularGeneratorView from "./TabularGeneratorView";
import RelationalGeneratorView from "./RelationalGeneratorView";
import DocumentGeneratorView from "./DocumentGeneratorView";
import DataProfilerView from "./DataProfilerView";
import DataTesterView from "./DataTesterView";
import SqlConsoleModal from "./SqlConsoleModal";
import {
  HistoryView,
  DatasetsCatalogView,
  DocumentsCatalogView,
  RelationalCatalogView,
  TemplatesView,
  SettingsView,
} from "./WorkspaceViews";
import { ALL_DOMAINS, getStoredDatasets, getStoredRelationalSchemas, getStoredDocuments } from "./workspaceStorage";
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const navSections = [
    {
      heading: "WORKSPACE",
      items: [
        { id: "ai_chat", label: "AI Workspace", badge: "CHATGPT" },
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
      heading: "STORAGE & REPOSITORY",
      items: [
        { id: "history", label: "History (Audit Log)" },
        { id: "datasets", label: "Generated Datasets" },
        { id: "documents_catalog", label: "Generated Documents" },
        { id: "relational_schemas", label: "Relational Schemas" },
        { id: "templates", label: "Domain Templates (14)" },
      ],
    },
    {
      heading: "ANALYZE & TEST",
      items: [
        { id: "profiler", label: "Data Profiler" },
        { id: "tester", label: "Data Tester" },
        { id: "settings", label: "Platform Settings" },
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

  // Search indexing across datasets, schemas, documents, and templates
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results = [];

    // Datasets
    getStoredDatasets().forEach((d) => {
      if (d.name?.toLowerCase().includes(q) || d.domain?.toLowerCase().includes(q)) {
        results.push({ type: "Dataset", label: d.name, sub: `${d.rowCount?.toLocaleString()} rows • ${d.domain}`, view: "datasets" });
      }
    });

    // Relational
    getStoredRelationalSchemas().forEach((s) => {
      if (s.name?.toLowerCase().includes(q) || s.domain?.toLowerCase().includes(q)) {
        results.push({ type: "Relational Schema", label: s.name, sub: `${s.tablesCount} tables • ${s.domain}`, view: "relational_schemas" });
      }
    });

    // Documents
    getStoredDocuments().forEach((doc) => {
      if (doc.title?.toLowerCase().includes(q) || doc.type?.toLowerCase().includes(q)) {
        results.push({ type: "Document Batch", label: doc.title, sub: `${doc.count} docs • ${doc.type}`, view: "documents_catalog" });
      }
    });

    // Templates
    ALL_DOMAINS.forEach((tmpl) => {
      if (tmpl.label?.toLowerCase().includes(q) || tmpl.desc?.toLowerCase().includes(q)) {
        results.push({ type: "Domain Template", label: `${tmpl.icon} ${tmpl.label}`, sub: tmpl.desc, view: "templates" });
      }
    });

    return results.slice(0, 6);
  }, [searchQuery]);

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
      {/* 1. SIDEBAR                                                                */}
      {/* ========================================================================= */}
      <aside
        style={{
          width: "250px",
          minWidth: "250px",
          backgroundColor: "#080808",
          borderRight: "1px solid #181818",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "20px 0",
          userSelect: "none",
          overflowY: "auto",
        }}
      >
        <div>
          {/* Logo Brand in Sidebar */}
          <div style={{ padding: "0 22px 18px 22px" }}>
            <CloakLogo size={22} wordmarkSize="15px" />
          </div>

          {/* "+ New Generation" CTA Button */}
          <div style={{ padding: "0 18px 18px 18px" }}>
            <button
              onClick={() => handleSelectView("ai_chat")}
              style={{
                width: "100%",
                backgroundColor: "#ff2a1a",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "10px 14px",
                fontSize: "12px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(255, 42, 26, 0.35)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ff4438")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ff2a1a")}
            >
              <span style={{ fontSize: "16px", lineHeight: "1" }}>+</span>
              <span>New Generation</span>
            </button>
          </div>

          {/* Navigation Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {navSections.map((sec, sIdx) => (
              <div key={sIdx}>
                {sec.heading && (
                  <div
                    style={{
                      fontFamily: "var(--cd-font-mono)",
                      fontSize: "10px",
                      color: "#444444",
                      letterSpacing: "0.12em",
                      padding: "0 22px",
                      marginBottom: "6px",
                      textTransform: "uppercase",
                    }}
                  >
                    {sec.heading}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                  {sec.items.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectView(item.id)}
                        style={{
                          padding: "7px 22px",
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
                        {item.badge && (
                          <span
                            style={{
                              fontSize: "9px",
                              backgroundColor: "rgba(255, 42, 26, 0.15)",
                              color: "#ff4d3d",
                              padding: "1px 5px",
                              borderRadius: "3px",
                              fontFamily: "monospace",
                              fontWeight: 700,
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer: Back to Platform Website */}
        <div style={{ padding: "16px 18px 0 18px", borderTop: "1px solid #141414" }}>
          <button
            onClick={onReturnToPlatform}
            style={{
              width: "100%",
              backgroundColor: "#0d0d0d",
              border: "1px solid #222222",
              borderRadius: "4px",
              padding: "9px 12px",
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
        {/* Topbar */}
        <header
          style={{
            height: "64px",
            backgroundColor: "#080808",
            borderBottom: "1px solid #181818",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          {/* Search Bar with ⌘K Badge and Live Results */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "#0f0f0f",
                border: isSearchFocused ? "1px solid #ff2a1a" : "1px solid #222222",
                borderRadius: "4px",
                padding: "7px 14px",
                width: "360px",
                transition: "border-color 0.15s ease",
              }}
            >
              <IconSearch size={14} color="#666666" />
              <input
                type="text"
                placeholder="Search datasets, schemas, documents, templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
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

            {/* Live Search Quick Results Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "115%",
                  left: 0,
                  width: "380px",
                  backgroundColor: "#0d0d0d",
                  border: "1px solid #282828",
                  borderRadius: "6px",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.85)",
                  zIndex: 200,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "6px 12px", fontSize: "10px", fontFamily: "monospace", color: "#666", borderBottom: "1px solid #1a1a1a" }}>
                  MATCHING WORKSPACE ENTITIES
                </div>
                {searchResults.map((res, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      handleSelectView(res.view);
                      setSearchQuery("");
                      if (showNotification) showNotification(`Opened ${res.type}: ${res.label}`);
                    }}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderBottom: "1px solid #141414",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#161616")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>{res.label}</span>
                      <span style={{ fontSize: "10px", color: "#ff4d3d", fontFamily: "monospace" }}>{res.type}</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#888888", marginTop: "2px" }}>{res.sub}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Topbar Elements (Status Badge, Bell, Avatar) */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Quick SQL Editor Button */}
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

            {/* Workspace Online Badge */}
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
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: "#10b981",
                  borderRadius: "50%",
                  display: "inline-block",
                  boxShadow: "0 0 8px #10b981",
                }}
              />
              <span>WORKSPACE ACTIVE</span>
            </div>

            {/* Notification Bell */}
            <div
              onClick={() => showNotification && showNotification("Notification stream up-to-date")}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "4px",
                border: "1px solid #222222",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#888888",
              }}
            >
              <IconBell size={15} />
            </div>

            {/* User Avatar */}
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#ff2a1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "12px",
                color: "#ffffff",
                boxShadow: "0 2px 8px rgba(255, 42, 26, 0.3)",
              }}
            >
              CD
            </div>
          </div>
        </header>

        {/* View Content Area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 32px",
            backgroundColor: "#050505",
          }}
        >
          {currentView === "ai_chat" && (
            <AIChatWorkspace
              onNavigateView={handleSelectView}
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

          {currentView === "history" && (
            <HistoryView
              onReopenItem={(item) => {
                const t = item.generatorType?.toLowerCase();
                if (t === "relational") handleSelectView("relational");
                else if (t === "document") handleSelectView("documents");
                else handleSelectView("tabular");
              }}
              showNotification={showNotification}
            />
          )}

          {currentView === "datasets" && (
            <DatasetsCatalogView
              onSelectDataset={() => handleSelectView("tabular")}
              showNotification={showNotification}
            />
          )}

          {currentView === "documents_catalog" && (
            <DocumentsCatalogView showNotification={showNotification} />
          )}

          {currentView === "relational_schemas" && (
            <RelationalCatalogView showNotification={showNotification} />
          )}

          {currentView === "templates" && (
            <TemplatesView
              onApplyTemplate={() => handleSelectView("tabular")}
            />
          )}

          {currentView === "settings" && (
            <SettingsView showNotification={showNotification} />
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
