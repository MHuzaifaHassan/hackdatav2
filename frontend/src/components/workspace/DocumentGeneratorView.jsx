import React, { useState } from "react";
import { downloadAndOpenFile, downloadJson } from "./fileDownload";

const API_BASE = "http://127.0.0.1:8000";

export default function DocumentGeneratorView({ onOpenSql, showNotification }) {
  const [docType, setDocType] = useState("customer_report");
  const [template, setTemplate] = useState("customer_report_v2");
  const [numDocs, setNumDocs] = useState("5,000");
  const [outputFormat, setOutputFormat] = useState("PDF");
  const [isGenerating, setIsGenerating] = useState(false);

  // Structure toggles
  const [structureHeader, setStructureHeader] = useState(true);
  const [structureTable, setStructureTable] = useState(true);
  const [structureNotes, setStructureNotes] = useState(false);

  // Fields
  const [fields, setFields] = useState([
    "Customer ID",
    "Customer Name",
    "Account Type",
    "Transaction Summary",
    "Address",
    "Metadata",
  ]);

  // Live dynamic document state
  const [docData, setDocData] = useState({
    customerId: "10482",
    accountType: "Premium",
    customerName: "Ayesha Raza",
    address: "14 Gulberg III, Lahore",
    transactions: [
      { date: "2026-09-03", desc: "Utility payment", amount: "4,250" },
      { date: "2026-09-07", desc: "Grocery purchase", amount: "12,700" },
      { date: "2026-09-10", desc: "Restaurant payment", amount: "3,600" },
    ],
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const names = ["Ayesha Raza", "Tariq Mansoor", "Zainab Malik", "Bilal Ahmed", "Sana Mir"];
      const addresses = [
        "14 Gulberg III, Lahore",
        "Block 4, Clifton, Karachi",
        "F-7/2, Islamabad",
        "Model Town, Lahore",
        "Cantt Area, Peshawar",
      ];
      const selectedName = names[Math.floor(Math.random() * names.length)];
      const selectedAddress = addresses[Math.floor(Math.random() * addresses.length)];
      const newId = String(10480 + Math.floor(Math.random() * 2000));

      setDocData({
        customerId: newId,
        accountType: Math.random() > 0.4 ? "Premium" : "Commercial",
        customerName: selectedName,
        address: selectedAddress,
        transactions: [
          { date: "2026-09-03", desc: "Utility payment", amount: (3000 + Math.floor(Math.random() * 2000)).toLocaleString() },
          { date: "2026-09-07", desc: "Grocery purchase", amount: (10000 + Math.floor(Math.random() * 5000)).toLocaleString() },
          { date: "2026-09-10", desc: "Restaurant payment", amount: (2500 + Math.floor(Math.random() * 3000)).toLocaleString() },
        ],
      });
      setIsGenerating(false);
      if (showNotification) showNotification(`Generated ${numDocs} reconciled synthetic ${docType} documents!`);
    }, 500);
  };

  const handleExport = async () => {
    if (outputFormat === "JSON") {
      downloadJson(docData, `customer_report_${docData.customerId}.json`);
      if (showNotification) showNotification(`Downloaded & opened customer_report_${docData.customerId}.json`);
      return;
    }

    // Export PDF via backend or client-side printable HTML blob
    try {
      const res = await fetch(`${API_BASE}/documents/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: "bank_statement",
          data: {
            account_id: docData.customerId,
            customer_name: docData.customerName,
            account_type: docData.accountType,
            statement_period: "2026-09-01 to 2026-09-30",
            opening_balance: 50000.0,
            closing_balance: 65000.0,
            transactions: docData.transactions.map((t, idx) => ({
              transaction_id: `TX-${1000 + idx}`,
              date: t.date,
              description: t.desc,
              amount: parseFloat(t.amount.replace(/,/g, "")),
              type: "DEBIT",
              balance_after: 50000.0 - (idx + 1) * 2000,
            })),
          },
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        downloadAndOpenFile(blob, `customer_report_${docData.customerId}.pdf`, "application/pdf", showNotification);
      } else {
        throw new Error("Backend PDF fallback");
      }
    } catch (e) {
      // Fallback HTML-based printable document
      const htmlDoc = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>CUSTOMER REPORT - ${docData.customerId}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #111; }
            h1 { font-size: 22px; border-bottom: 2px solid #ff2a1a; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
          </style>
        </head>
        <body>
          <h1>CUSTOMER REPORT #${docData.customerId}</h1>
          <p><strong>Name:</strong> ${docData.customerName}</p>
          <p><strong>Account Type:</strong> ${docData.accountType}</p>
          <p><strong>Address:</strong> ${docData.address}</p>
          <h3>Transaction Summary</h3>
          <table>
            <tr><th>Date</th><th>Description</th><th>Amount (PKR)</th></tr>
            ${docData.transactions.map((t) => `<tr><td>${t.date}</td><td>${t.desc}</td><td>${t.amount}</td></tr>`).join("")}
          </table>
          <p style="margin-top: 30px; font-size: 11px; color: #666;">Generated by CLOAKDATA Synthetic Document Suite</p>
        </body>
        </html>
      `;
      downloadAndOpenFile(htmlDoc, `customer_report_${docData.customerId}.html`, "text/html", showNotification);
    }
  };

  return (
    <div style={{ color: "#ffffff", padding: "8px 0" }}>
      {/* Top Header (Exact Screenshot 3 Replica) */}
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
            GENERATE / DOCUMENTS
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", color: "#ffffff" }}>
            Document Generator
          </h2>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {onOpenSql && (
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
          )}

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
            onClick={handleExport}
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
            Export
          </button>

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
            <span>Generate</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls (1fr) + Right Document Paper Preview (1.3fr) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.3fr",
          gap: "28px",
          alignItems: "flex-start",
        }}
        className="document-grid"
      >
        {/* Left Panel: Form Controls (Exact Screenshot 3 Replica) */}
        <div
          style={{
            backgroundColor: "#0d0d0d",
            border: "1px solid #1c1c1c",
            borderRadius: "4px",
            padding: "24px",
          }}
        >
          {/* Document Type & Template Selectors */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "16px", marginBottom: "20px" }}>
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
                DOCUMENT TYPE
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
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
              >
                <option value="customer_report">Customer report</option>
                <option value="bank_statement">Bank statement</option>
                <option value="tax_invoice">Commercial tax invoice</option>
                <option value="clinical_report">Clinical lab report</option>
              </select>
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
                TEMPLATE
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
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
              >
                <option value="customer_report_v2">customer_report_v2</option>
                <option value="fintech_ledger_v1">fintech_ledger_v1</option>
                <option value="healthcare_discharge_v3">healthcare_discharge_v3</option>
              </select>
            </div>
          </div>

          {/* Number of Documents */}
          <div style={{ marginBottom: "22px" }}>
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
              NUMBER OF DOCUMENTS
            </label>
            <input
              type="text"
              value={numDocs}
              onChange={(e) => setNumDocs(e.target.value)}
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

          {/* Fields Pills */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontFamily: "var(--cd-font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#666666",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              FIELDS
            </label>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {fields.map((f, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#110b0a",
                    border: "1px solid rgba(255, 42, 26, 0.5)",
                    color: "#ffffff",
                    borderRadius: "3px",
                    padding: "5px 10px",
                    fontSize: "11px",
                    fontFamily: "var(--cd-font-mono)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{f}</span>
                </div>
              ))}
              <button
                onClick={() => {
                  const nf = prompt("Enter additional field name:");
                  if (nf) setFields([...fields, nf]);
                }}
                style={{
                  backgroundColor: "transparent",
                  border: "1px dashed #333333",
                  color: "#888888",
                  borderRadius: "3px",
                  padding: "5px 10px",
                  fontSize: "11px",
                  fontFamily: "var(--cd-font-mono)",
                  cursor: "pointer",
                }}
              >
                + Field
              </button>
            </div>
          </div>

          {/* Structure Toggles */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontFamily: "var(--cd-font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#666666",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              STRUCTURE
            </label>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#cccccc" }}>Header + key-value block</span>
                <div
                  onClick={() => setStructureHeader(!structureHeader)}
                  style={{
                    width: "36px",
                    height: "18px",
                    backgroundColor: structureHeader ? "#ff2a1a" : "#222222",
                    borderRadius: "9px",
                    position: "relative",
                    cursor: "pointer",
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
                      left: structureHeader ? "20px" : "2px",
                      transition: "left 0.2s ease",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#cccccc" }}>Transaction table</span>
                <div
                  onClick={() => setStructureTable(!structureTable)}
                  style={{
                    width: "36px",
                    height: "18px",
                    backgroundColor: structureTable ? "#ff2a1a" : "#222222",
                    borderRadius: "9px",
                    position: "relative",
                    cursor: "pointer",
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
                      left: structureTable ? "20px" : "2px",
                      transition: "left 0.2s ease",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#cccccc" }}>Free-text notes</span>
                <div
                  onClick={() => setStructureNotes(!structureNotes)}
                  style={{
                    width: "36px",
                    height: "18px",
                    backgroundColor: structureNotes ? "#ff2a1a" : "#222222",
                    borderRadius: "9px",
                    position: "relative",
                    cursor: "pointer",
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
                      left: structureNotes ? "20px" : "2px",
                      transition: "left 0.2s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Output Format */}
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
                marginBottom: "10px",
              }}
            >
              OUTPUT FORMAT
            </label>

            <div style={{ display: "flex", gap: "8px" }}>
              {["PDF", "DOCX", "JSON", "TEXT"].map((fmt) => {
                const isSel = outputFormat === fmt;
                return (
                  <button
                    key={fmt}
                    onClick={() => setOutputFormat(fmt)}
                    style={{
                      fontFamily: "var(--cd-font-mono)",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "6px 14px",
                      borderRadius: "2px",
                      border: isSel ? "1px solid #ff2a1a" : "1px solid #282828",
                      backgroundColor: isSel ? "#1a0807" : "#080808",
                      color: isSel ? "#ff2a1a" : "#777777",
                      cursor: "pointer",
                    }}
                  >
                    {fmt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Document Sheet Preview (Exact Screenshot 3 Replica) */}
        <div
          style={{
            backgroundColor: "#0d0d0d",
            border: "1px solid rgba(255, 42, 26, 0.4)",
            borderRadius: "4px",
            padding: "24px",
            boxShadow: "0 0 20px rgba(255, 42, 26, 0.1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              fontFamily: "var(--cd-font-mono)",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>Preview</span>
            <span style={{ fontSize: "10px", color: "#666666", letterSpacing: "0.1em" }}>
              DOCUMENT 1 OF {numDocs} · EXAMPLE
            </span>
          </div>

          {/* White Paper Document Surface (Exact Screenshot 3 Replica) */}
          <div
            style={{
              backgroundColor: "#ffffff",
              color: "#111111",
              borderRadius: "3px",
              padding: "36px 32px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              minHeight: "440px",
              position: "relative",
            }}
          >
            {/* Title & Red Accent Mark */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1.5px solid #111111",
                paddingBottom: "12px",
                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "#111111",
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                CUSTOMER REPORT
              </h3>
              <div style={{ width: "12px", height: "12px", backgroundColor: "#ff2a1a" }} />
            </div>

            {/* Key-Value Block */}
            {structureHeader && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                  marginBottom: "28px",
                  fontSize: "12px",
                }}
              >
                <div>
                  <div style={{ fontSize: "9px", fontFamily: "var(--cd-font-mono)", color: "#777777", textTransform: "uppercase" }}>
                    CUSTOMER ID
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 800, marginTop: "2px" }}>
                    {docData.customerId}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "9px", fontFamily: "var(--cd-font-mono)", color: "#777777", textTransform: "uppercase" }}>
                    ACCOUNT TYPE
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, marginTop: "2px" }}>
                    {docData.accountType}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "9px", fontFamily: "var(--cd-font-mono)", color: "#777777", textTransform: "uppercase" }}>
                    CUSTOMER NAME
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "2px" }}>
                    {docData.customerName}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "9px", fontFamily: "var(--cd-font-mono)", color: "#777777", textTransform: "uppercase" }}>
                    ADDRESS
                  </div>
                  <div style={{ fontSize: "13px", color: "#333333", marginTop: "2px" }}>
                    {docData.address}
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Summary Table */}
            {structureTable && (
              <div style={{ marginBottom: "28px" }}>
                <div
                  style={{
                    fontSize: "9px",
                    fontFamily: "var(--cd-font-mono)",
                    color: "#777777",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #e0e0e0",
                    paddingBottom: "6px",
                    marginBottom: "10px",
                  }}
                >
                  TRANSACTION SUMMARY
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                  {docData.transactions.map((tx, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--cd-font-mono)" }}>
                      <span style={{ color: "#555555" }}>{tx.date}</span>
                      <span style={{ color: "#222222", flex: 1, paddingLeft: "16px" }}>{tx.desc}</span>
                      <span style={{ fontWeight: 700, color: "#111111" }}>{tx.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata Tag */}
            <div>
              <div style={{ fontSize: "9px", fontFamily: "var(--cd-font-mono)", color: "#777777", textTransform: "uppercase", marginBottom: "6px" }}>
                METADATA
              </div>
              <span
                style={{
                  backgroundColor: "#111111",
                  color: "#ffffff",
                  fontFamily: "var(--cd-font-mono)",
                  fontSize: "10px",
                  padding: "3px 8px",
                  borderRadius: "2px",
                }}
              >
                synthetic: true
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .document-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
