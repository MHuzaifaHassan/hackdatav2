import React from "react";

export default function WhyCloakData({ onOpenWorkspace }) {
  const pillars = [
    {
      label: "PRIVACY-AWARE",
      title: "Privacy-Aware Architecture",
      desc: "Designed to reduce unnecessary exposure of sensitive source data through mathematical synthesis, masked entity fields, and differential privacy foundations.",
      metric: "ZERO UNINTENDED LEAKAGE",
    },
    {
      label: "REALISTIC",
      title: "Statistical Realism",
      desc: "Preserve relevant statistical properties, non-linear cross-column correlations, and exact multi-table foreign key relationships with 0 orphaned child records.",
      metric: "94.8% AVG FIDELITY",
    },
    {
      label: "CONFIGURABLE",
      title: "Fine-Grained Controls",
      desc: "Control generation seeds, volume scales, null-rates, outlier injection tolerances, localized currencies, and temporal monotonicity across every table.",
      metric: "DETERMINISTIC SEEDING",
    },
    {
      label: "DEVELOPER READY",
      title: "Developer First",
      desc: "Designed for AI pipelines, analytics, CI/CD automated staging fixtures, and developer sandboxes with zero external dependency friction.",
      metric: "REST API & JSON SPEC",
    },
  ];

  return (
    <section
      id="why-cloak"
      style={{
        backgroundColor: "#080808",
        borderBottom: "1px solid var(--cd-border-subtle)",
        padding: "100px 0",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "0 24px" }}>
        {/* Section Header */}
        <div style={{ marginBottom: "64px" }}>
          <div
            style={{
              fontFamily: "var(--cd-font-mono)",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "#ff2a1a",
              marginBottom: "16px",
            }}
          >
            WHY CLOAKDATA?
          </div>
          <h2
            style={{
              fontSize: "clamp(42px, 6vw, 84px)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.02,
              color: "#ffffff",
              textTransform: "none",
            }}
          >
            Turn sensitive data
            <br />
            <span style={{ color: "#ff2a1a" }}>into usable data.</span>
          </h2>
        </div>

        {/* 4 Pillars Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "24px",
          }}
          className="pillars-grid"
        >
          {pillars.map((p, idx) => (
            <div
              key={p.label}
              style={{
                backgroundColor: "#0d0d0d",
                border: "1px solid #1c1c1c",
                borderRadius: "4px",
                padding: "36px 26px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "360px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 42, 26, 0.4)";
                e.currentTarget.style.backgroundColor = "#111111";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1c1c1c";
                e.currentTarget.style.backgroundColor = "#0d0d0d";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "var(--cd-font-mono)",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "#ff2a1a",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>0{idx + 1}</span>
                  <span>—</span>
                  <span>{p.label}</span>
                </div>

                <h3
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#ffffff",
                    letterSpacing: "-0.02em",
                    marginBottom: "16px",
                    lineHeight: 1.2,
                  }}
                >
                  {p.title}
                </h3>

                <p
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.65,
                    color: "#a0a0a0",
                  }}
                >
                  {p.desc}
                </p>
              </div>

              <div
                style={{
                  borderTop: "1px solid #1c1c1c",
                  paddingTop: "18px",
                  marginTop: "24px",
                  fontFamily: "var(--cd-font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  color: "#666666",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>{p.metric}</span>
                <span style={{ color: "#ff2a1a" }}>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .pillars-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .pillars-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
