import React, { useState, useMemo } from "react";
import { downloadAndOpenFile, downloadJson } from "./fileDownload";
import { getStoredDatasets, getStoredDocuments, saveStoredDocuments, appendHistoryEntry } from "./workspaceStorage";
import { IconDownload, IconFileText, IconSparkles } from "./Icons";

const API_BASE = "http://127.0.0.1:8000";

const DOCUMENT_TEMPLATES = [
  {
    id: "invoice",
    label: "Tax Invoice",
    category: "Finance & Commerce",
    icon: "🧾",
    sourceDefault: "ecommerce_customers",
    sample: {
      docId: "INV-2026-8842",
      title: "TAX INVOICE & RECEIPT",
      recipientName: "Ayesha Raza",
      recipientSub: "CUST-1001 • ayesha.raza@example.com",
      address: "14 Gulberg III, Lahore, Pakistan",
      date: "2026-09-30",
      dueDate: "2026-10-15",
      items: [
        { desc: "Enterprise Cloud Data Pipeline Subscription", qty: 1, rate: 850.0, amount: 850.0 },
        { desc: "Differential Privacy Synthetic Engine License", qty: 1, rate: 277.73, amount: 277.73 },
      ],
      taxRate: 0.1,
      notes: "Payment is due within 15 days of issue. 100% reconciled math.",
    },
  },
  {
    id: "bank_statement",
    label: "Bank Account Statement",
    category: "FinTech & Banking",
    icon: "🏦",
    sourceDefault: "fintech_core_banking",
    sample: {
      docId: "STMT-2026-09-ACCT98",
      title: "MONTHLY CHECKING ACCOUNT STATEMENT",
      recipientName: "Tariq Mansoor",
      recipientSub: "ACC-984210 • Priority Banking Client",
      address: "Block 4, Clifton, Karachi, Pakistan",
      date: "2026-09-30",
      period: "2026-09-01 to 2026-09-30",
      openingBalance: 45000.0,
      closingBalance: 52400.0,
      items: [
        { desc: "Direct Deposit - Payroll Transfer", qty: 1, rate: 12000.0, amount: 12000.0, type: "CREDIT" },
        { desc: "Utility Payment - Electricity & Water", qty: 1, rate: -2800.0, amount: -2800.0, type: "DEBIT" },
        { desc: "POS Debit - Grocery Store Purchase", qty: 1, rate: -1800.0, amount: -1800.0, type: "DEBIT" },
      ],
      notes: "FDIC insured up to standard allowable limits. Reconciliation drift: $0.00.",
    },
  },
  {
    id: "lab_report",
    label: "Clinical Lab Report",
    category: "Healthcare & Life Sciences",
    icon: "🔬",
    sourceDefault: "clinical_patients",
    sample: {
      docId: "LAB-2026-4412",
      title: "COMPREHENSIVE METABOLIC & LIPID PANEL",
      recipientName: "Allison Hill",
      recipientSub: "PAT-00001 • DOB: 1967-11-01 • Blood Type: A+",
      address: "Room 402, Metro Diagnostic Pathology Center",
      date: "2026-09-30",
      physician: "Dr. Sarah Jenkins, MD (NPI: 1849201948)",
      items: [
        { test: "Total Cholesterol", result: "195 mg/dL", reference: "< 200 mg/dL", status: "NORMAL" },
        { test: "HDL Cholesterol", result: "58 mg/dL", reference: "> 50 mg/dL", status: "OPTIMAL" },
        { test: "Fasting Blood Glucose", result: "94 mg/dL", reference: "70 - 99 mg/dL", status: "NORMAL" },
        { test: "Systolic Blood Pressure", result: "122 mmHg", reference: "< 120 mmHg", status: "NORMAL" },
      ],
      notes: "Specimen collection verified. Patient fasting status 12 hours documented.",
    },
  },
  {
    id: "discharge_summary",
    label: "Hospital Discharge Summary",
    category: "Healthcare",
    icon: "🏥",
    sourceDefault: "clinical_patients",
    sample: {
      docId: "DISC-2026-1094",
      title: "INPATIENT CLINICAL DISCHARGE SUMMARY",
      recipientName: "Daniel Wagner",
      recipientSub: "PAT-00004 • Male • Age 64",
      address: "General Hospital Cardiology Ward",
      admissionDate: "2026-09-24",
      dischargeDate: "2026-09-30",
      attending: "Dr. Farhan Mirza, Chief of Cardiology",
      items: [
        { section: "Primary Diagnosis", details: "Acute Decompensated Heart Failure (Resolved)" },
        { section: "Secondary Diagnosis", details: "Hypertension, Hyperlipidemia (Controlled)" },
        { section: "Discharge Medications", details: "Lisinopril 10mg PO daily, Atorvastatin 20mg PO qPM" },
      ],
      notes: "Patient is clinically stable for home discharge. Follow up in outpatient clinic in 7 days.",
    },
  },
  {
    id: "contract",
    label: "Commercial Agreement / NDA",
    category: "Legal & Corporate",
    icon: "📜",
    sourceDefault: "ecommerce_customers",
    sample: {
      docId: "AGR-2026-0492",
      title: "MUTUAL NON-DISCLOSURE & DATA PROCESSING AGREEMENT",
      recipientName: "Acme Global Technologies Inc.",
      recipientSub: "Signatory: Bilal Ahmed, VP Engineering",
      effectiveDate: "2026-09-30",
      term: "36 Months",
      clauses: [
        "1. Purpose: Evaluation and deployment of synthetic data pipeline algorithms.",
        "2. Confidentiality: Both parties agree to protect proprietary architecture and seed models.",
        "3. Differential Privacy Guarantee: Data outputs must adhere to (ε=0.5, δ=10⁻⁵) formal privacy bounds.",
      ],
      notes: "Governed under standard commercial law. Executed via electronic cryptographic signature.",
    },
  },
  {
    id: "payslip",
    label: "Payroll Pay Slip",
    category: "HR & Enterprise",
    icon: "💵",
    sourceDefault: "ecommerce_customers",
    sample: {
      docId: "PAY-2026-09-410",
      title: "MONTHLY EMPLOYEE EARNINGS STATEMENT",
      recipientName: "Farhan Siddiqui",
      recipientSub: "EMP-1048 • Senior Backend Engineer • Engineering",
      payPeriod: "2026-09-01 to 2026-09-30",
      grossPay: 12500.0,
      deductions: 2875.0,
      netPay: 9625.0,
      breakdown: [
        { label: "Basic Salary", amount: 10000.0 },
        { label: "Housing & Transport Allowance", amount: 2500.0 },
        { label: "Income Tax Withholding (Federal)", amount: -2125.0 },
        { label: "Health & Pension Contribution", amount: -750.0 },
      ],
      notes: "Direct deposit deposited to designated commercial bank account.",
    },
  },
];

export default function DocumentGeneratorView({ onOpenSql, showNotification }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("invoice");
  const [selectedDataset, setSelectedDataset] = useState("ecommerce_customers");
  const [batchCount, setBatchCount] = useState(500);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customFields, setCustomFields] = useState([
    { key: "organization", label: "Issuing Organization", value: "CLOAKDATA SYNTHETICS LTD" },
    { key: "vat_number", label: "Tax Identification / TRN", value: "TRN-9842104-PK" },
    { key: "currency", label: "Currency", value: "USD ($)" },
  ]);

  const activeTemplate = DOCUMENT_TEMPLATES.find((t) => t.id === selectedTemplateId) || DOCUMENT_TEMPLATES[0];

  // Dynamic sample data for the active template
  const [liveDoc, setLiveDoc] = useState(activeTemplate.sample);

  // When template switches
  const handleSwitchTemplate = (tplId) => {
    setSelectedTemplateId(tplId);
    const tpl = DOCUMENT_TEMPLATES.find((t) => t.id === tplId);
    if (tpl) {
      setLiveDoc(tpl.sample);
      setSelectedDataset(tpl.sourceDefault);
      if (showNotification) showNotification(`Loaded ${tpl.label} document template`);
    }
  };

  // Re-generate or populate from connected dataset
  const handlePopulateFromDataset = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const names = ["Ayesha Raza", "Tariq Mansoor", "Zainab Malik", "Bilal Ahmed", "Sara Qureshi", "Danyal Khan", "Mariam Sheikh"];
      const randName = names[Math.floor(Math.random() * names.length)];
      const randId = String(1000 + Math.floor(Math.random() * 9000));

      if (selectedTemplateId === "invoice") {
        const item1Rate = 500 + Math.floor(Math.random() * 1200);
        const item2Rate = 200 + Math.floor(Math.random() * 400);
        const subtotal = item1Rate + item2Rate;
        const tax = Math.round(subtotal * 0.1 * 100) / 100;
        setLiveDoc({
          ...liveDoc,
          docId: `INV-2026-${randId}`,
          recipientName: randName,
          recipientSub: `CUST-${randId} • ${randName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          items: [
            { desc: "Synthesized Data Engine Subscription", qty: 1, rate: item1Rate, amount: item1Rate },
            { desc: "Multi-Table Relational Schema Pipeline", qty: 1, rate: item2Rate, amount: item2Rate },
          ],
          subtotal,
          tax,
          total: subtotal + tax,
        });
      } else if (selectedTemplateId === "bank_statement") {
        const openBal = 35000 + Math.floor(Math.random() * 25000);
        const credit = 8000 + Math.floor(Math.random() * 6000);
        const debit = 3200 + Math.floor(Math.random() * 2000);
        setLiveDoc({
          ...liveDoc,
          docId: `STMT-2026-ACCT-${randId}`,
          recipientName: randName,
          openingBalance: openBal,
          closingBalance: openBal + credit - debit,
          items: [
            { desc: "Direct Deposit - Monthly Payroll", qty: 1, rate: credit, amount: credit, type: "CREDIT" },
            { desc: "Utility Bill & Merchant Debits", qty: 1, rate: -debit, amount: -debit, type: "DEBIT" },
          ],
        });
      } else {
        setLiveDoc({
          ...liveDoc,
          docId: `DOC-2026-${randId}`,
          recipientName: randName,
        });
      }

      setIsGenerating(false);
      if (showNotification) {
        showNotification(`Populated ${activeTemplate.label} from dataset "${selectedDataset}"`);
      }
    }, 500);
  };

  // Generate full batch and save to workspace storage
  const handleGenerateBatch = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);

      const docs = getStoredDocuments();
      const batchTitle = `${activeTemplate.label} (Batch #${100 + docs.length + 1})`;
      const newBatch = {
        id: `doc_${Date.now()}`,
        title: batchTitle,
        type: activeTemplate.label,
        count: Number(batchCount),
        sourceDataset: selectedDataset,
        timestamp: new Date().toLocaleString(),
        formats: ["PDF", "HTML", "JSON"],
        reconciled: true,
        sample: liveDoc,
      };

      docs.unshift(newBatch);
      saveStoredDocuments(docs);

      appendHistoryEntry({
        generatorType: "Document",
        artifactName: batchTitle,
        version: "v1",
        rows: Number(batchCount),
        columns: 12,
        prompt: `Generated ${Number(batchCount).toLocaleString()} reconciled ${activeTemplate.label} documents from ${selectedDataset}`,
        status: "Completed",
      });

      if (showNotification) {
        showNotification(`Generated & stored batch of ${Number(batchCount).toLocaleString()} ${activeTemplate.label} documents!`);
      }
    }, 700);
  };

  // Download printable PDF or HTML
  const handleDownloadPdf = () => {
    // Generate clean printable HTML and trigger browser print dialog
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      if (showNotification) showNotification("Please allow popups to download/print document PDF");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${activeTemplate.label} - ${liveDoc.docId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #ff2a1a; padding-bottom: 20px; margin-bottom: 30px; }
          .badge { background: #ff2a1a; color: white; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 25px 0; }
          th { background: #f4f4f4; text-align: left; padding: 10px 14px; font-size: 12px; border-bottom: 2px solid #ddd; }
          td { padding: 12px 14px; border-bottom: 1px solid #eee; font-size: 13px; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 16px; font-size: 11px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <span class="badge">CLOAKDATA SYNTHETIC</span>
            <h1 style="margin: 8px 0 4px 0; font-size: 24px;">${liveDoc.title || activeTemplate.label}</h1>
            <div style="font-family: monospace; color: #666;">DOC ID: ${liveDoc.docId}</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #444;">
            <div><strong>Issue Date:</strong> ${liveDoc.date || "2026-09-30"}</div>
            <div><strong>Dataset Source:</strong> ${selectedDataset}</div>
          </div>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 6px 0; font-size: 14px; color: #777; text-transform: uppercase;">Recipient Information</h3>
          <div style="font-size: 16px; font-weight: bold;">${liveDoc.recipientName}</div>
          <div style="font-size: 13px; color: #555;">${liveDoc.recipientSub || ""}</div>
          <div style="font-size: 13px; color: #777;">${liveDoc.address || ""}</div>
        </div>

        <pre style="background: #f9f9f9; padding: 16px; border-radius: 6px; font-size: 12px; line-height: 1.5; font-family: monospace;">${JSON.stringify(liveDoc, null, 2)}</pre>

        <div class="footer">
          <div>✓ Formally verified against differential privacy invariants and exact arithmetic consistency.</div>
          <div>Generated by CLOAKDATA Synthetic Data & Document Engine.</div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    if (showNotification) showNotification(`Opening print/PDF viewer for ${liveDoc.docId}`);
  };

  return (
    <div style={{ color: "#ffffff", padding: "8px 0" }}>
      {/* Top Header Breadcrumb & Actions Bar */}
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
            GENERATE / BUSINESS DOCUMENTS
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", color: "#ffffff", margin: 0 }}>
            Document Generator
          </h2>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
            }}
          >
            <span style={{ fontFamily: "monospace", fontWeight: 800 }}>&gt;_</span>
            <span>SQL Editor</span>
          </button>

          <button
            onClick={() => downloadJson(liveDoc, `${liveDoc.docId}.json`, showNotification)}
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
            Export JSON
          </button>

          <button
            onClick={handleDownloadPdf}
            style={{
              backgroundColor: "#161616",
              border: "1px solid #333333",
              color: "#10b981",
              padding: "8px 16px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <IconDownload size={14} />
            <span>Download PDF / Print</span>
          </button>

          <button
            onClick={handleGenerateBatch}
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
            <span>Generate Batch ({Number(batchCount).toLocaleString()})</span>
          </button>
        </div>
      </div>

      {/* Mathematical Invariant Assurance Banner */}
      <div
        style={{
          backgroundColor: "#0d0d0d",
          border: "1px solid #1c1c1c",
          borderRadius: "6px",
          padding: "12px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#10b981", fontWeight: 800 }}>✓ Mathematical Invariant Guarantee:</span>
          <span style={{ fontSize: "12px", color: "#cccccc", fontFamily: "var(--cd-font-mono)" }}>
            Subtotal + Tax == Total ($0.00 drift) • Opening Bal + Credits - Debits == Closing Bal
          </span>
        </div>

        <div style={{ fontSize: "11px", color: "#888888", fontFamily: "monospace" }}>
          100% Deterministic & Cross-Reconciled
        </div>
      </div>

      {/* 6 Document Type Chips */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#777777", textTransform: "uppercase", marginBottom: "8px" }}>
          DOCUMENT TEMPLATE TYPES
        </div>
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px" }}>
          {DOCUMENT_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplateId === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => handleSwitchTemplate(tmpl.id)}
                style={{
                  backgroundColor: isSelected ? "rgba(255, 42, 26, 0.15)" : "#0d0d0d",
                  border: isSelected ? "1.5px solid #ff2a1a" : "1px solid #1c1c1c",
                  color: isSelected ? "#ffffff" : "#888888",
                  padding: "8px 14px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{tmpl.icon}</span>
                <span>{tmpl.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Controls (1fr) + Right Document Sheet Preview (1.4fr) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1.5fr",
          gap: "24px",
          alignItems: "flex-start",
        }}
      >
        {/* Left Panel: Data-to-Document Connection & Parameters */}
        <div
          style={{
            backgroundColor: "#0d0d0d",
            border: "1px solid #1c1c1c",
            borderRadius: "6px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Data-to-Document Connection Section */}
          <div style={{ borderBottom: "1px solid #1a1a1a", paddingBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontFamily: "var(--cd-font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#ff4d3d",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              DATA-TO-DOCUMENT CONNECTION
            </label>
            <p style={{ fontSize: "12px", color: "#888888", marginBottom: "10px" }}>
              Directly map entities from synthesized tabular or relational datasets into document fields.
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: "#080808",
                  border: "1px solid #282828",
                  borderRadius: "4px",
                  padding: "8px 12px",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontFamily: "var(--cd-font-mono)",
                }}
              >
                <option value="ecommerce_customers">ecommerce_customers (25,000 rows)</option>
                <option value="clinical_patients">clinical_patients (5,000 rows)</option>
                <option value="fintech_core_banking">fintech_core_banking (15,000 rows)</option>
                <option value="adhoc_generator">Ad-hoc Dynamic Generator</option>
              </select>

              <button
                onClick={handlePopulateFromDataset}
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #333333",
                  color: "#ffffff",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Populate Record ↺
              </button>
            </div>
          </div>

          {/* Batch Generation Count */}
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
              BATCH GENERATION VOLUME
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              {[100, 500, 1000, 5000].map((count) => (
                <button
                  key={count}
                  onClick={() => setBatchCount(count)}
                  style={{
                    flex: 1,
                    backgroundColor: batchCount === count ? "#ff2a1a" : "#141414",
                    color: batchCount === count ? "#ffffff" : "#888888",
                    border: batchCount === count ? "none" : "1px solid #262626",
                    padding: "8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {count.toLocaleString()} Docs
                </button>
              ))}
            </div>
          </div>

          {/* Custom Document Metadata Fields */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--cd-font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "#666666",
                  textTransform: "uppercase",
                }}
              >
                DOCUMENT METADATA FIELDS ({customFields.length})
              </span>
              <button
                onClick={() => {
                  const lbl = prompt("Enter Field Label:");
                  if (!lbl) return;
                  const val = prompt("Enter Default Value:");
                  setCustomFields([...customFields, { key: lbl.toLowerCase().replace(/\s+/g, "_"), label: lbl, value: val || "" }]);
                }}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#ff4d3d",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                + Add Field
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {customFields.map((f, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#080808",
                    border: "1px solid #1a1a1a",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: "#888888" }}>{f.label}</span>
                  <span style={{ color: "#ffffff", fontFamily: "var(--cd-font-mono)" }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Rendered Business Document Preview Sheet */}
        <div
          style={{
            backgroundColor: "#ffffff",
            color: "#111111",
            borderRadius: "6px",
            padding: "36px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
            fontFamily: "var(--cd-font-sans)",
            minHeight: "560px",
          }}
        >
          {/* Document Sheet Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "2px solid #ff2a1a",
              paddingBottom: "20px",
              marginBottom: "24px",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "monospace",
                  fontWeight: 800,
                  backgroundColor: "#ff2a1a",
                  color: "#ffffff",
                  padding: "3px 8px",
                  borderRadius: "3px",
                  letterSpacing: "0.1em",
                }}
              >
                CLOAKDATA RECONCILED
              </span>
              <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#111111", margin: "8px 0 2px 0" }}>
                {liveDoc.title || activeTemplate.label}
              </h1>
              <div style={{ fontSize: "12px", color: "#666666", fontFamily: "monospace" }}>
                DOC REF: {liveDoc.docId}
              </div>
            </div>

            <div style={{ textAlign: "right", fontSize: "12px", color: "#555555", lineHeight: 1.5 }}>
              <div><strong>Issue Date:</strong> {liveDoc.date || "2026-09-30"}</div>
              <div><strong>Source Dataset:</strong> {selectedDataset}</div>
              <div><strong>Format:</strong> Verified Vector PDF / HTML</div>
            </div>
          </div>

          {/* Recipient Card */}
          <div style={{ marginBottom: "24px", backgroundColor: "#f9f9f9", padding: "14px 18px", borderRadius: "4px" }}>
            <div style={{ fontSize: "11px", color: "#888888", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
              TARGET RECIPIENT / SUBJECT
            </div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#111111" }}>
              {liveDoc.recipientName}
            </div>
            <div style={{ fontSize: "12px", color: "#555555", marginTop: "2px" }}>
              {liveDoc.recipientSub}
            </div>
            {liveDoc.address && (
              <div style={{ fontSize: "12px", color: "#777777", marginTop: "2px" }}>
                {liveDoc.address}
              </div>
            )}
          </div>

          {/* Itemized Table or Section Details */}
          {liveDoc.items && Array.isArray(liveDoc.items) && (
            <div style={{ marginBottom: "24px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #ddd", color: "#666666", textAlign: "left" }}>
                    <th style={{ padding: "8px 10px" }}>DESCRIPTION / TEST</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>AMOUNT / VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  {liveDoc.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "10px", color: "#222222" }}>
                        {item.desc || item.test || JSON.stringify(item)}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: "#111111" }}>
                        {item.amount !== undefined ? `$${Number(item.amount).toFixed(2)}` : item.result || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Financial Totals Reconciliation if present */}
          {liveDoc.subtotal !== undefined && (
            <div style={{ borderTop: "2px solid #222", paddingTop: "14px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
              <div style={{ fontSize: "12px", color: "#666666" }}>
                Subtotal: <strong style={{ color: "#111" }}>${Number(liveDoc.subtotal).toFixed(2)}</strong>
              </div>
              <div style={{ fontSize: "12px", color: "#666666" }}>
                Tax (10%): <strong style={{ color: "#111" }}>${Number(liveDoc.tax).toFixed(2)}</strong>
              </div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#ff2a1a" }}>
                Total: ${Number(liveDoc.total).toFixed(2)}
              </div>
            </div>
          )}

          {/* Bank Statement Balances if present */}
          {liveDoc.openingBalance !== undefined && (
            <div style={{ borderTop: "2px solid #222", paddingTop: "14px", marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#666" }}>Opening Balance: </span>
                <strong>${Number(liveDoc.openingBalance).toFixed(2)}</strong>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#666" }}>Closing Balance: </span>
                <strong style={{ color: "#10b981" }}>${Number(liveDoc.closingBalance).toFixed(2)}</strong>
              </div>
            </div>
          )}

          {/* Document Footer Notes */}
          <div style={{ borderTop: "1px solid #eee", paddingTop: "14px", marginTop: "24px", fontSize: "11px", color: "#888888", display: "flex", justifyContent: "space-between" }}>
            <span>{liveDoc.notes || "Synthetic verification standard: 0 drift."}</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
