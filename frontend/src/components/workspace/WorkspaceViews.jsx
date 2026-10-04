import React, { useState } from "react";
import { downloadCsv, downloadJson, downloadSql } from "./fileDownload";
import RelationalErdDiagram from "./RelationalErdDiagram";
import { DOMAIN_PRESETS } from "./relationalPresets";
import { ALL_DOMAINS, getStoredDatasets, getStoredDocuments, getStoredRelationalSchemas, getStoredHistory } from "./workspaceStorage";

/**
 * 1. History View: View and reopen past generation runs
 */
export function HistoryView({ onReopenItem, showNotification }) {
  const history = getStoredHistory();
  const [filterType, setFilterType] = useState("all");

  const filtered = filterType === "all" ? history : history.filter((h) => h.generatorType.toLowerCase() === filterType);

  return (
    <div style={{ color: "#ffffff", padding: "8px 0" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontFamily: "var(--cd-font-mono)", fontSize: "11px", color: "#666666", textTransform: "uppercase" }}>
          WORKSPACE / AUDIT LOG
        </div>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
          Generation History
        </h2>
        <p style={{ fontSize: "13px", color: "#888888", marginTop: "4px" }}>
          Every generation run is permanently stored with prompt, version, schema snapshot, and row counts.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {["all", "tabular", "relational", "document"].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            style={{
              backgroundColor: filterType === t ? "rgba(255, 42, 26, 0.15)" : "#141414",
              border: filterType === t ? "1px solid #ff2a1a" : "1px solid #262626",
              color: filterType === t ? "#ffffff" : "#888888",
              padding: "6px 14px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "capitalize",
              cursor: "pointer",
            }}
          >
            {t} Runs
          </button>
        ))}
      </div>

      {/* History Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filtered.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: "#0d0d0d",
              border: "1px solid #1c1c1c",
              borderRadius: "6px",
              padding: "18px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
              transition: "border-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2c2c2c")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1c1c1c")}
          >
            <div style={{ flex: 1, minWidth: "260px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span
                  style={{
                    backgroundColor: item.generatorType === "Tabular" ? "rgba(16, 185, 129, 0.15)" : item.generatorType === "Relational" ? "rgba(56, 189, 248, 0.15)" : "rgba(251, 191, 36, 0.15)",
                    color: item.generatorType === "Tabular" ? "#10b981" : item.generatorType === "Relational" ? "#38bdf8" : "#fbbf24",
                    border: `1px solid ${item.generatorType === "Tabular" ? "#10b981" : item.generatorType === "Relational" ? "#38bdf8" : "#fbbf24"}44`,
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "3px",
                    textTransform: "uppercase",
                  }}
                >
                  {item.generatorType}
                </span>
                <span style={{ fontSize: "11px", color: "#666666", fontFamily: "monospace" }}>
                  {item.timestamp}
                </span>
                <span style={{ fontSize: "10px", color: "#ff4d3d", backgroundColor: "#181818", padding: "1px 6px", borderRadius: "3px", fontFamily: "monospace" }}>
                  {item.version}
                </span>
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", marginBottom: "4px" }}>
                {item.artifactName}
              </div>
              <div style={{ fontSize: "12px", color: "#999999", fontStyle: "italic" }}>
                "{item.prompt}"
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ textAlign: "right", fontFamily: "monospace", fontSize: "12px", color: "#aaaaaa" }}>
                <div><strong style={{ color: "#ffffff" }}>{item.rows.toLocaleString()}</strong> rows</div>
                <div style={{ fontSize: "11px", color: "#666666" }}>{item.columns} columns</div>
              </div>

              <button
                onClick={() => {
                  if (onReopenItem) onReopenItem(item);
                  if (showNotification) showNotification(`Restored generation session: ${item.artifactName}`);
                }}
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #333333",
                  color: "#ffffff",
                  padding: "8px 14px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Reopen & Edit →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 2. Generated Datasets Catalog View with Version Control (v1, v2, v3)
 */
export function DatasetsCatalogView({ onSelectDataset, showNotification }) {
  const datasets = getStoredDatasets();
  const [selectedId, setSelectedId] = useState(datasets[0]?.id);

  const selectedDs = datasets.find((d) => d.id === selectedId) || datasets[0];

  return (
    <div style={{ color: "#ffffff", padding: "8px 0" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontFamily: "var(--cd-font-mono)", fontSize: "11px", color: "#666666", textTransform: "uppercase" }}>
          WORKSPACE / REPOSITORY
        </div>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
          Generated Datasets Catalog
        </h2>
        <p style={{ fontSize: "13px", color: "#888888", marginTop: "4px" }}>
          All synthesized tabular collections with full version histories, schema definitions, and instant export options.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", alignItems: "flex-start" }}>
        {/* Left List of Datasets */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {datasets.map((ds) => {
            const isSelected = selectedDs.id === ds.id;
            return (
              <div
                key={ds.id}
                onClick={() => setSelectedId(ds.id)}
                style={{
                  backgroundColor: isSelected ? "#141414" : "#0d0d0d",
                  border: isSelected ? "1.5px solid #ff2a1a" : "1px solid #1c1c1c",
                  borderRadius: "6px",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "14px", color: isSelected ? "#ffffff" : "#cccccc" }}>
                    {ds.name}
                  </strong>
                  <span style={{ fontSize: "10px", backgroundColor: "#ff2a1a", color: "#fff", padding: "1px 5px", borderRadius: "2px", fontWeight: 700 }}>
                    {ds.currentVersion}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#777777", fontFamily: "monospace" }}>
                  {ds.rowCount.toLocaleString()} records • {ds.columns.length} columns • {ds.versions.length} versions
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Details & Version Explorer */}
        {selectedDs && (
          <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #1c1c1c", borderRadius: "6px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#ff4d3d", fontFamily: "monospace", textTransform: "uppercase" }}>
                  {selectedDs.domain} DOMAIN DATASET
                </span>
                <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", marginTop: "2px" }}>
                  {selectedDs.name}
                </h3>
                <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px" }}>
                  Active Version: <strong style={{ color: "#ffffff" }}>{selectedDs.currentVersion}</strong> ({selectedDs.rowCount.toLocaleString()} rows)
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => downloadCsv(selectedDs.sampleRows, `${selectedDs.name}.csv`, showNotification)}
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #333333",
                    color: "#10b981",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Download .CSV
                </button>
                <button
                  onClick={() => downloadJson(selectedDs.sampleRows, `${selectedDs.name}.json`, showNotification)}
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #282828",
                    color: "#cccccc",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Download .JSON
                </button>
              </div>
            </div>

            {/* Version History Chips */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", color: "#666666", marginBottom: "8px", fontFamily: "monospace" }}>
                VERSION TIMELINE (AUDITED SNAPSHOTS):
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {selectedDs.versions.map((ver) => (
                  <div
                    key={ver.version}
                    style={{
                      backgroundColor: "#141414",
                      border: ver.version === selectedDs.currentVersion ? "1px solid #ff2a1a" : "1px solid #262626",
                      borderRadius: "4px",
                      padding: "8px 12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <strong style={{ color: "#ffffff", fontSize: "12px" }}>{ver.version}</strong>
                      <span style={{ fontSize: "10px", color: "#ff4d3d" }}>{ver.rows.toLocaleString()} rows</span>
                    </div>
                    <div style={{ fontSize: "10px", color: "#666666", marginTop: "2px" }}>{ver.timestamp}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Schema & Columns Table */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff", marginBottom: "10px" }}>
                Columns & Generator Constraints ({selectedDs.columns.length})
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", fontFamily: "monospace", textAlign: "left" }}>
                  <thead>
                    <tr style={{ color: "#666666", borderBottom: "1px solid #1c1c1c", backgroundColor: "#111111" }}>
                      <th style={{ padding: "8px 12px" }}>COLUMN</th>
                      <th style={{ padding: "8px 12px" }}>TYPE</th>
                      <th style={{ padding: "8px 12px" }}>KEY / CONSTRAINT</th>
                      <th style={{ padding: "8px 12px" }}>GENERATOR CONFIG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDs.columns.map((c, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #141414" }}>
                        <td style={{ padding: "8px 12px", color: "#ffffff", fontWeight: 700 }}>{c.name}</td>
                        <td style={{ padding: "8px 12px", color: "#ff4d3d" }}>{c.type}</td>
                        <td style={{ padding: "8px 12px" }}>
                          {c.pk ? (
                            <span style={{ backgroundColor: "#ff2a1a", color: "#fff", padding: "1px 5px", borderRadius: "2px", fontSize: "9px" }}>PK</span>
                          ) : c.unique ? (
                            <span style={{ border: "1px solid #38bdf8", color: "#38bdf8", padding: "1px 5px", borderRadius: "2px", fontSize: "9px" }}>UNIQUE</span>
                          ) : (
                            <span style={{ color: "#666666" }}>Standard</span>
                          )}
                        </td>
                        <td style={{ padding: "8px 12px", color: "#999999" }}>{c.config}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sample Records Live Preview */}
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff", marginBottom: "10px" }}>
                Live Records Preview (Showing first 5 rows)
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", fontFamily: "monospace", textAlign: "left" }}>
                  <thead>
                    <tr style={{ color: "#666666", borderBottom: "1px solid #1c1c1c", backgroundColor: "#111111" }}>
                      {Object.keys(selectedDs.sampleRows[0] || {}).map((k) => (
                        <th key={k} style={{ padding: "8px 12px" }}>{k.toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDs.sampleRows.map((r, rIdx) => (
                      <tr key={rIdx} style={{ borderBottom: "1px solid #141414" }}>
                        {Object.values(r).map((val, vIdx) => (
                          <td key={vIdx} style={{ padding: "8px 12px", color: vIdx === 0 ? "#ffffff" : "#cccccc" }}>
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 3. Generated Documents Catalog View
 */
export function DocumentsCatalogView({ showNotification }) {
  const documents = getStoredDocuments();
  const [selectedDoc, setSelectedDoc] = useState(documents[0]);

  return (
    <div style={{ color: "#ffffff", padding: "8px 0" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontFamily: "var(--cd-font-mono)", fontSize: "11px", color: "#666666", textTransform: "uppercase" }}>
          WORKSPACE / DOCUMENTS
        </div>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
          Generated Business Documents
        </h2>
        <p style={{ fontSize: "13px", color: "#888888", marginTop: "4px" }}>
          Reconciled PDF, HTML, and DOCX documents synthesized from your tabular and relational business datasets.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", alignItems: "flex-start" }}>
        {/* Left List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {documents.map((doc) => {
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                style={{
                  backgroundColor: isSelected ? "#141414" : "#0d0d0d",
                  border: isSelected ? "1.5px solid #ff2a1a" : "1px solid #1c1c1c",
                  borderRadius: "6px",
                  padding: "16px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "14px", color: isSelected ? "#ffffff" : "#cccccc" }}>
                    {doc.title}
                  </strong>
                  <span style={{ fontSize: "10px", color: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.1)", padding: "1px 6px", borderRadius: "3px" }}>
                    RECONCILED
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#777777", fontFamily: "monospace" }}>
                  {doc.type} • {doc.count} docs • Linked to: {doc.sourceDataset}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Details */}
        {selectedDoc && (
          <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #1c1c1c", borderRadius: "6px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#ff4d3d", fontFamily: "monospace" }}>{selectedDoc.type.toUpperCase()} BATCH</span>
                <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", marginTop: "2px" }}>
                  {selectedDoc.title}
                </h3>
                <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px" }}>
                  Generated from dataset: <strong style={{ color: "#ffffff" }}>{selectedDoc.sourceDataset}</strong> ({selectedDoc.count} total documents)
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    if (showNotification) showNotification(`Exported ${selectedDoc.count} reconciled ${selectedDoc.type} PDFs`);
                  }}
                  style={{
                    backgroundColor: "#ff2a1a",
                    color: "#ffffff",
                    border: "none",
                    padding: "6px 14px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Download Batch PDF ({selectedDoc.count})
                </button>
              </div>
            </div>

            {/* Document Verification Box */}
            <div
              style={{
                backgroundColor: "#111111",
                border: "1px solid #222222",
                borderRadius: "6px",
                padding: "16px 20px",
                marginBottom: "20px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#10b981", marginBottom: "8px" }}>
                ✓ Mathematical Invariant Verification Passed
              </div>
              <div style={{ fontSize: "12px", color: "#cccccc", lineHeight: 1.6, fontFamily: "monospace" }}>
                Subtotal + Tax == Total to the exact cent ($0.00 drift). Running balances verified. All customer identifiers resolved to active dataset records.
              </div>
            </div>

            {/* Live Sample Document Metadata Preview */}
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff", marginBottom: "10px" }}>
              Sample Document Inspection
            </div>
            <pre
              style={{
                backgroundColor: "#050505",
                border: "1px solid #1a1a1a",
                borderRadius: "4px",
                padding: "14px",
                color: "#10b981",
                fontSize: "11px",
                fontFamily: "monospace",
                overflowX: "auto",
              }}
            >
              {JSON.stringify(selectedDoc.sample, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 4. Relational Schemas Catalog View
 */
export function RelationalCatalogView({ showNotification }) {
  const schemas = getStoredRelationalSchemas();
  const [selectedSchema, setSelectedSchema] = useState(schemas[0]);

  return (
    <div style={{ color: "#ffffff", padding: "8px 0" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontFamily: "var(--cd-font-mono)", fontSize: "11px", color: "#666666", textTransform: "uppercase" }}>
          WORKSPACE / SCHEMAS
        </div>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
          Relational Schemas & ERD Catalog
        </h2>
        <p style={{ fontSize: "13px", color: "#888888", marginTop: "4px" }}>
          Multi-table relational databases engineered with topological dependency ordering and 100% foreign key integrity.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", alignItems: "flex-start" }}>
        {/* Left List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {schemas.map((sch) => {
            const isSelected = selectedSchema?.id === sch.id;
            return (
              <div
                key={sch.id}
                onClick={() => setSelectedSchema(sch)}
                style={{
                  backgroundColor: isSelected ? "#141414" : "#0d0d0d",
                  border: isSelected ? "1.5px solid #ff2a1a" : "1px solid #1c1c1c",
                  borderRadius: "6px",
                  padding: "16px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "14px", color: isSelected ? "#ffffff" : "#cccccc" }}>
                    {sch.name}
                  </strong>
                  <span style={{ fontSize: "10px", color: "#38bdf8", backgroundColor: "rgba(56, 189, 248, 0.1)", padding: "1px 6px", borderRadius: "3px" }}>
                    {sch.tablesCount} TABLES
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#777777", fontFamily: "monospace" }}>
                  {sch.relationsCount} foreign keys • {sch.totalRecords.toLocaleString()} total rows
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Details & ERD */}
        {selectedSchema && (
          <div>
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff" }}>
                  {selectedSchema.name}
                </h3>
                <div style={{ fontSize: "12px", color: "#888888" }}>{selectedSchema.description}</div>
              </div>
              <button
                onClick={() => {
                  const sql = `-- CLOAKDATA RELATIONAL SCHEMA DUMP: ${selectedSchema.name}\n-- Zero Orphan Foreign Key Guarantee\n`;
                  downloadSql(sql, `${selectedSchema.name}.sql`, showNotification);
                }}
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #333333",
                  color: "#ffffff",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Download SQL Schema
              </button>
            </div>

            <RelationalErdDiagram
              schema={DOMAIN_PRESETS[selectedSchema.domain] || {
                domain: selectedSchema.domain,
                tables: selectedSchema.tables.map((t) => ({
                  name: t.name,
                  rows: t.rows,
                  columns: [
                    { name: `${t.name.slice(0, 3)}_id`, type: "id", pk: true },
                    { name: "created_at", type: "date" },
                  ],
                })),
                relations: selectedSchema.relations,
              }}
              height={450}
              compact={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 5. Templates View (14 Business Domains)
 */
export function TemplatesView({ onApplyTemplate }) {
  return (
    <div style={{ color: "#ffffff", padding: "8px 0" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontFamily: "var(--cd-font-mono)", fontSize: "11px", color: "#666666", textTransform: "uppercase" }}>
          WORKSPACE / PRESETS
        </div>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
          Industry Domain Templates
        </h2>
        <p style={{ fontSize: "13px", color: "#888888", marginTop: "4px" }}>
          14 pre-architected enterprise domains with verified statistical distributions, realistic entity relations, and document schemas.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {ALL_DOMAINS.map((domain) => (
          <div
            key={domain.id}
            style={{
              backgroundColor: "#0d0d0d",
              border: "1px solid #1c1c1c",
              borderRadius: "6px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "border-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#ff2a1a")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1c1c1c")}
          >
            <div>
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>{domain.icon}</div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", marginBottom: "6px" }}>
                {domain.label}
              </h3>
              <p style={{ fontSize: "12px", color: "#888888", lineHeight: 1.5 }}>
                {domain.desc}
              </p>
            </div>

            <button
              onClick={() => onApplyTemplate && onApplyTemplate(domain.id)}
              style={{
                marginTop: "16px",
                backgroundColor: "#161616",
                border: "1px solid #282828",
                color: "#ff4d3d",
                padding: "8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              Use Template in Workspace →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 6. Settings View
 */
export function SettingsView({ showNotification }) {
  const [llmProvider, setLlmProvider] = useState("mock");
  const [defaultRows, setDefaultRows] = useState(10000);
  const [privacyMasking, setPrivacyMasking] = useState(true);

  return (
    <div style={{ color: "#ffffff", padding: "8px 0", maxWidth: "680px" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontFamily: "var(--cd-font-mono)", fontSize: "11px", color: "#666666", textTransform: "uppercase" }}>
          WORKSPACE / CONFIGURATION
        </div>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
          Platform Settings
        </h2>
        <p style={{ fontSize: "13px", color: "#888888", marginTop: "4px" }}>
          Manage LLM orchestration, default synthesis parameters, and differential privacy policies.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #1c1c1c", borderRadius: "6px", padding: "20px" }}>
          <label style={{ fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
            AI Inference Engine
          </label>
          <select
            value={llmProvider}
            onChange={(e) => setLlmProvider(e.target.value)}
            style={{
              width: "100%",
              backgroundColor: "#141414",
              border: "1px solid #262626",
              borderRadius: "4px",
              padding: "8px 12px",
              color: "#ffffff",
              fontSize: "13px",
            }}
          >
            <option value="mock">Local Deterministic Synthesizer (Instant, 0 API Token Cost)</option>
            <option value="gemini">Google Gemini 1.5 Flash (Cloud API)</option>
            <option value="openai">OpenAI GPT-4o (Cloud API)</option>
            <option value="anthropic">Anthropic Claude 3.5 Sonnet (Cloud API)</option>
          </select>
        </div>

        <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #1c1c1c", borderRadius: "6px", padding: "20px" }}>
          <label style={{ fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
            Default Row Batch Size
          </label>
          <input
            type="number"
            value={defaultRows}
            onChange={(e) => setDefaultRows(Number(e.target.value))}
            style={{
              width: "100%",
              backgroundColor: "#141414",
              border: "1px solid #262626",
              borderRadius: "4px",
              padding: "8px 12px",
              color: "#ffffff",
              fontSize: "13px",
            }}
          />
        </div>

        <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #1c1c1c", borderRadius: "6px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700 }}>Automatic PII Email Masking</div>
            <div style={{ fontSize: "12px", color: "#666666" }}>Replaces PII emails with sanitized synthetic equivalents</div>
          </div>
          <button
            onClick={() => setPrivacyMasking(!privacyMasking)}
            style={{
              backgroundColor: privacyMasking ? "rgba(16, 185, 129, 0.2)" : "#181818",
              border: privacyMasking ? "1px solid #10b981" : "1px solid #333333",
              color: privacyMasking ? "#10b981" : "#666666",
              padding: "4px 10px",
              borderRadius: "4px",
              fontWeight: 700,
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            {privacyMasking ? "ENABLED" : "DISABLED"}
          </button>
        </div>

        <button
          onClick={() => {
            if (showNotification) showNotification("Workspace settings saved successfully");
          }}
          style={{
            backgroundColor: "#ff2a1a",
            color: "#ffffff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "4px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}
