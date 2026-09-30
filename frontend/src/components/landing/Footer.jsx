import React from "react";
import CloakLogo from "./CloakLogo";

export default function Footer({ onOpenWorkspace, onNavigateSection }) {
  const scrollTo = (id) => {
    if (onNavigateSection) {
      onNavigateSection(id);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer
      style={{
        backgroundColor: "#050505",
        padding: "80px 0 40px 0",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "0 24px" }}>
        {/* Top Footer Columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr",
            gap: "40px",
            marginBottom: "60px",
          }}
          className="footer-grid"
        >
          {/* Brand Info */}
          <div>
            <CloakLogo size={24} wordmarkSize="16px" />
            <p
              style={{
                fontSize: "13px",
                lineHeight: 1.6,
                color: "#777777",
                marginTop: "16px",
                maxWidth: "280px",
              }}
            >
              Enterprise-grade synthetic data platform. Generate, understand,
              validate, and test realistic datasets without sensitive data exposure.
            </p>
            <div style={{ marginTop: "20px" }}>
              <span
                style={{
                  fontFamily: "var(--cd-font-mono)",
                  fontSize: "10px",
                  color: "#ff2a1a",
                  backgroundColor: "#160a09",
                  border: "1px solid rgba(255, 42, 26, 0.4)",
                  padding: "4px 8px",
                  borderRadius: "2px",
                }}
              >
                ● SYSTEM STATUS: ALL ENGINES OPERATIONAL
              </span>
            </div>
          </div>

          {/* Column 1: Platform */}
          <div>
            <h5
              style={{
                fontFamily: "var(--cd-font-mono)",
                fontSize: "11px",
                letterSpacing: "0.12em",
                color: "#ffffff",
                marginBottom: "16px",
                fontWeight: 700,
              }}
            >
              PLATFORM
            </h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <span onClick={() => scrollTo("features")} style={{ color: "#888888", cursor: "pointer" }}>
                Tabular Engine
              </span>
              <span onClick={() => scrollTo("features")} style={{ color: "#888888", cursor: "pointer" }}>
                Relational DAGs
              </span>
              <span onClick={() => scrollTo("features")} style={{ color: "#888888", cursor: "pointer" }}>
                Document Generator
              </span>
              <span onClick={() => scrollTo("features")} style={{ color: "#888888", cursor: "pointer" }}>
                Data Profiler
              </span>
              <span onClick={() => scrollTo("features")} style={{ color: "#888888", cursor: "pointer" }}>
                TSTR Data Tester
              </span>
            </div>
          </div>

          {/* Column 2: Solutions */}
          <div>
            <h5
              style={{
                fontFamily: "var(--cd-font-mono)",
                fontSize: "11px",
                letterSpacing: "0.12em",
                color: "#ffffff",
                marginBottom: "16px",
                fontWeight: 700,
              }}
            >
              SOLUTIONS
            </h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#888888" }}>
              <span>AI & ML Training</span>
              <span>QA & Sandbox Testing</span>
              <span>Fintech Reconciled Data</span>
              <span>Clinical Healthcare</span>
              <span>Supply Chain Logistics</span>
            </div>
          </div>

          {/* Column 3: Developers */}
          <div>
            <h5
              style={{
                fontFamily: "var(--cd-font-mono)",
                fontSize: "11px",
                letterSpacing: "0.12em",
                color: "#ffffff",
                marginBottom: "16px",
                fontWeight: 700,
              }}
            >
              DEVELOPERS
            </h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#888888" }}>
              <span>REST API Reference</span>
              <span>Python SDK</span>
              <span>JSON Domain Specs</span>
              <span>Differential Privacy Specs</span>
              <span>GitHub Repository</span>
            </div>
          </div>

          {/* Column 4: Workspace */}
          <div>
            <h5
              style={{
                fontFamily: "var(--cd-font-mono)",
                fontSize: "11px",
                letterSpacing: "0.12em",
                color: "#ffffff",
                marginBottom: "16px",
                fontWeight: 700,
              }}
            >
              WORKSPACE
            </h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <span onClick={onOpenWorkspace} style={{ color: "#ff2a1a", cursor: "pointer", fontWeight: 600 }}>
                Launch Workspace →
              </span>
              <span onClick={() => scrollTo("workspace-preview")} style={{ color: "#888888", cursor: "pointer" }}>
                Architecture Preview
              </span>
              <span style={{ color: "#888888" }}>Security & Privacy</span>
              <span style={{ color: "#888888" }}>Terms of Service</span>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Note */}
        <div
          style={{
            borderTop: "1px solid #141414",
            paddingTop: "28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            fontSize: "12px",
            color: "#555555",
          }}
        >
          <div>
            © {new Date().getFullYear()} CLOAKDATA TECHNOLOGIES. ALL RIGHTS RESERVED.
          </div>
          <div style={{ maxWidth: "600px", textAlign: "right" }}>
            CLOAKDATA provides deterministic and statistical synthetic data generation technology. Synthetic data is generated for testing, development, and research purposes.
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
