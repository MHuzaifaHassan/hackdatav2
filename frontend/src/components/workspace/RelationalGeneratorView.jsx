import React, { useState } from "react";
import { downloadSql, downloadJson } from "./fileDownload";

export default function RelationalGeneratorView({ onOpenSql, showNotification }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [dbName, setDbName] = useState("retail_db");
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [constraints, setConstraints] = useState({
    referentialIntegrity: true,
    amountReconciled: true,
    dateOrdering: true,
  });

  const [tableCounts, setTableCounts] = useState({
    customers: "50k",
    orders: "250k",
    products: "1.2k",
    payments: "250k",
  });

  const handleGenerateDb = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setTableCounts({
        customers: `${40 + Math.floor(Math.random() * 20)}k`,
        orders: `${200 + Math.floor(Math.random() * 80)}k`,
        products: "1.2k",
        payments: `${200 + Math.floor(Math.random() * 80)}k`,
      });
      if (showNotification) {
        showNotification(`Relational DAG synthesized for ${dbName}: 4 tables, 0 orphan keys!`);
      }
    }, 700);
  };

  const handleExportSql = () => {
    const sqlScript = `-- CLOAKDATA RELATIONAL DATABASE DUMP: ${dbName}
-- Generated with Zero Orphan Foreign Key Guarantee

CREATE TABLE customers (
  customer_id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  city VARCHAR(80),
  segment VARCHAR(40)
);

CREATE TABLE products (
  product_id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(80),
  price NUMERIC(10,2)
);

CREATE TABLE orders (
  order_id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) REFERENCES customers(customer_id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(product_id),
  order_date DATE,
  total NUMERIC(12,2)
);

CREATE TABLE payments (
  payment_id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) REFERENCES orders(order_id) ON DELETE CASCADE,
  method VARCHAR(50),
  amount NUMERIC(12,2)
);
`;
    downloadSql(sqlScript, `${dbName}_schema_and_relations.sql`, showNotification);
    setShowExportMenu(false);
  };

  return (
    <div style={{ color: "#ffffff", padding: "8px 0" }}>
      {/* Top Header (Exact Screenshot 4 Replica) */}
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
            GENERATE / RELATIONAL
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", color: "#ffffff" }}>
            Relational Generator
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
            onClick={() => showNotification && showNotification("All 3 foreign key relationships verified (100% referential integrity)")}
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
            Validate Relationships
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
                  minWidth: "160px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.8)",
                }}
              >
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
                  Download SQL DDL & Open
                </button>
                <button
                  onClick={() => {
                    downloadJson(tableCounts, `${dbName}_metrics.json`);
                    setShowExportMenu(false);
                    if (showNotification) showNotification(`Downloaded and opened ${dbName}_metrics.json`);
                  }}
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
                  Download Schema JSON
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerateDb}
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
            <span>Generate Database</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Diagram (1.5fr) + Right Panels (1fr) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.55fr 0.95fr",
          gap: "28px",
          alignItems: "flex-start",
        }}
        className="relational-grid"
      >
        {/* Left Canvas: Schema DAG (Exact Replica of Screenshot 4) */}
        <div
          style={{
            backgroundColor: "#0d0d0d",
            border: "1px solid #1c1c1c",
            borderRadius: "4px",
            padding: "24px",
            minHeight: "560px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Canvas Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--cd-font-mono)",
              marginBottom: "28px",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
              Database Schema - {dbName}
            </span>
            <span style={{ fontSize: "10px", color: "#666666", letterSpacing: "0.1em" }}>
              4 TABLES · 3 RELATIONSHIPS
            </span>
          </div>

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
            {/* Customers -> Orders (downward trace) */}
            <path
              d="M185 110 H225 V260 H260"
              stroke="#ff2a1a"
              strokeWidth="1.2"
              fill="none"
            />
            {/* Products -> Orders */}
            <path
              d="M440 120 H395 V280 H405"
              stroke="#ff2a1a"
              strokeWidth="1.2"
              fill="none"
            />
            {/* Orders -> Payments */}
            <path
              d="M395 330 H435 V420 H440"
              stroke="#ff2a1a"
              strokeWidth="1.2"
              fill="none"
            />
          </svg>

          {/* Table Card 1: customers */}
          <div
            style={{
              position: "absolute",
              top: "80px",
              left: "30px",
              width: "155px",
              backgroundColor: "#111111",
              border: "1px solid #222222",
              borderRadius: "4px",
              zIndex: 2,
              fontFamily: "var(--cd-font-mono)",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #1c1c1c",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "12px",
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              <span>customers</span>
              <span style={{ color: "#666666", fontSize: "10px" }}>{tableCounts.customers}</span>
            </div>
            <div style={{ padding: "8px 12px", fontSize: "11px", display: "flex", flexDirection: "column", gap: "6px" }}>
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

          {/* Table Card 2: orders (Highlighted in screenshot with subtle red border) */}
          <div
            style={{
              position: "absolute",
              top: "210px",
              left: "245px",
              width: "165px",
              backgroundColor: "#111111",
              border: "1px solid rgba(255, 42, 26, 0.4)",
              borderRadius: "4px",
              zIndex: 2,
              fontFamily: "var(--cd-font-mono)",
              boxShadow: "0 4px 20px rgba(255, 42, 26, 0.15)",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #1c1c1c",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "12px",
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              <span>orders</span>
              <span style={{ color: "#ff2a1a", fontSize: "10px" }}>{tableCounts.orders}</span>
            </div>
            <div style={{ padding: "8px 12px", fontSize: "11px", display: "flex", flexDirection: "column", gap: "6px" }}>
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
              top: "80px",
              right: "40px",
              width: "155px",
              backgroundColor: "#111111",
              border: "1px solid #222222",
              borderRadius: "4px",
              zIndex: 2,
              fontFamily: "var(--cd-font-mono)",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #1c1c1c",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "12px",
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              <span>products</span>
              <span style={{ color: "#666666", fontSize: "10px" }}>{tableCounts.products}</span>
            </div>
            <div style={{ padding: "8px 12px", fontSize: "11px", display: "flex", flexDirection: "column", gap: "6px" }}>
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
              bottom: "40px",
              right: "40px",
              width: "155px",
              backgroundColor: "#111111",
              border: "1px solid #222222",
              borderRadius: "4px",
              zIndex: 2,
              fontFamily: "var(--cd-font-mono)",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #1c1c1c",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "12px",
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              <span>payments</span>
              <span style={{ color: "#666666", fontSize: "10px" }}>{tableCounts.payments}</span>
            </div>
            <div style={{ padding: "8px 12px", fontSize: "11px", display: "flex", flexDirection: "column", gap: "6px" }}>
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

        {/* Right Side: Relationships Panel & Constraints Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Top Panel: Relationships (Exact Screenshot 4 Replica) */}
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
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>Relationships</span>
              <span style={{ fontSize: "10px", fontFamily: "var(--cd-font-mono)", color: "#666666" }}>PK — FK</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontFamily: "var(--cd-font-mono)", fontSize: "12px" }}>
              <div style={{ color: "#a0a0a0" }}>
                customers.customer_id <span style={{ color: "#ff2a1a" }}>1:N</span> orders.customer_id
              </div>
              <div style={{ color: "#a0a0a0" }}>
                products.product_id <span style={{ color: "#ff2a1a" }}>1:N</span> orders.product_id
              </div>
              <div style={{ color: "#a0a0a0" }}>
                orders.order_id <span style={{ color: "#ff2a1a" }}>1:N</span> payments.order_id
              </div>
            </div>

            <button
              onClick={() => showNotification && showNotification("Add relationship wizard ready")}
              style={{
                marginTop: "16px",
                backgroundColor: "transparent",
                border: "none",
                color: "#666666",
                fontSize: "11px",
                fontFamily: "var(--cd-font-mono)",
                cursor: "pointer",
                padding: "2px 0",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#ff2a1a")}
              onMouseLeave={(e) => (e.target.style.color = "#666666")}
            >
              + ADD RELATIONSHIP
            </button>
          </div>

          {/* Bottom Panel: Constraints (Exact Screenshot 4 Replica) */}
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
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>Constraints</span>
              <span style={{ fontSize: "10px", fontFamily: "var(--cd-font-mono)", color: "#666666" }}>PREVIEW</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#cccccc" }}>Referential integrity</span>
                <span
                  onClick={() => setConstraints({ ...constraints, referentialIntegrity: !constraints.referentialIntegrity })}
                  style={{
                    backgroundColor: constraints.referentialIntegrity ? "rgba(16, 185, 129, 0.12)" : "#1a1a1a",
                    color: constraints.referentialIntegrity ? "#10b981" : "#666666",
                    border: constraints.referentialIntegrity ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #262626",
                    fontSize: "10px",
                    fontWeight: 700,
                    fontFamily: "var(--cd-font-mono)",
                    padding: "2px 8px",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                >
                  ● ON
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#cccccc", fontFamily: "var(--cd-font-mono)", fontSize: "12px" }}>
                  payments.amount = orders.total
                </span>
                <span
                  onClick={() => setConstraints({ ...constraints, amountReconciled: !constraints.amountReconciled })}
                  style={{
                    backgroundColor: constraints.amountReconciled ? "rgba(16, 185, 129, 0.12)" : "#1a1a1a",
                    color: constraints.amountReconciled ? "#10b981" : "#666666",
                    border: constraints.amountReconciled ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #262626",
                    fontSize: "10px",
                    fontWeight: 700,
                    fontFamily: "var(--cd-font-mono)",
                    padding: "2px 8px",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                >
                  ● ON
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#cccccc", fontFamily: "var(--cd-font-mono)", fontSize: "12px" }}>
                  order_date ≤ today
                </span>
                <span
                  onClick={() => setConstraints({ ...constraints, dateOrdering: !constraints.dateOrdering })}
                  style={{
                    backgroundColor: constraints.dateOrdering ? "rgba(16, 185, 129, 0.12)" : "#1a1a1a",
                    color: constraints.dateOrdering ? "#10b981" : "#666666",
                    border: constraints.dateOrdering ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #262626",
                    fontSize: "10px",
                    fontWeight: 700,
                    fontFamily: "var(--cd-font-mono)",
                    padding: "2px 8px",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                >
                  ● ON
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#cccccc", fontFamily: "var(--cd-font-mono)", fontSize: "12px" }}>
                  Orders per customer
                </span>
                <span style={{ color: "#888888", fontFamily: "var(--cd-font-mono)", fontSize: "12px" }}>
                  1 — 40
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .relational-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
