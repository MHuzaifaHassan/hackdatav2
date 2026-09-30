import React, { useState } from "react";

export default function WorkflowSection() {
  const [activeStep, setActiveStep] = useState(2); // default to step 03 Generate

  const steps = [
    {
      num: "01",
      title: "Upload",
      summary: "Bring your dataset into the platform.",
      detail: "Ingest CSV, Parquet, JSON, or SQL dump schema files directly through the web UI or REST API. No raw data leaves your controlled environment.",
      metric: "FORMATS: CSV, JSON, SQL, PARQUET",
      codeSnippet: `curl -X POST https://api.cloakdata.io/v1/datasets/upload \\
  -F "file=@source_customers.csv" \\
  -H "Authorization: Bearer cd_live_sec_..."`,
    },
    {
      num: "02",
      title: "Profile",
      summary: "Understand schema, distributions, relationships, and quality.",
      detail: "Analyze column types, statistical moments, missingness rates, uniqueness constraints, and cross-column correlation matrices automatically.",
      metric: "FIDELITY: KS-2SAMP & JENSEN-SHANNON",
      codeSnippet: `GET /v1/datasets/profiler?dataset_id=cust_8820
Response:
{ "columns": 18, "correlations_detected": 14, "null_pct": 0.012 }`,
    },
    {
      num: "03",
      title: "Generate",
      summary: "Create synthetic data according to the selected configuration.",
      detail: "Synthesize high-fidelity tabular rows, multi-table DAG relational databases with 0 orphan FKs, and operational customer documents with deterministic seed control.",
      metric: "CARDINALITY: 1-TO-1, 1-TO-N, M-TO-N",
      codeSnippet: `POST /v1/relational/generate
{
  "tables": ["customers", "orders", "payments"],
  "seed": 42,
  "rows": { "customers": 5000, "orders": 25000 }
}`,
    },
    {
      num: "04",
      title: "Validate",
      summary: "Test quality, structure, constraints, and similarity.",
      detail: "Execute the TSTR (Train on Synthetic, Test on Real) benchmark, verify differential privacy distance, and confirm chronological monotonicity.",
      metric: "BENCHMARK: TSTR UTILITY & TRTR SCORE",
      codeSnippet: `POST /v1/evaluation/tstr
{
  "target_column": "income_segment",
  "fidelity_ks_p_value": 0.941,
  "privacy_exact_matches": 0
}`,
    },
    {
      num: "05",
      title: "Export",
      summary: "Use the generated dataset in your workflow.",
      detail: "Export to downstream AI pipelines, QA staging databases, or download audit-ready JSON compliance reports and PDF certificates.",
      metric: "OUTPUTS: SQL DUMP, CSV BUNDLE, PDF AUDIT",
      codeSnippet: `GET /v1/export/bundle?format=sql&dataset_id=syn_db_90
File: cloakdata_synthetic_relational_bundle.zip (Ready)`,
    },
  ];

  return (
    <section
      id="workflow"
      style={{
        backgroundColor: "#050505",
        borderBottom: "1px solid var(--cd-border-subtle)",
        padding: "100px 0",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "0 24px" }}>
        {/* Section Header */}
        <div style={{ marginBottom: "60px" }}>
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
            END-TO-END PIPELINE
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
            From real data to <br />
            <span style={{ color: "#ff2a1a" }}>usable synthetic data.</span>
          </h2>
          <p
            style={{
              fontSize: "17px",
              lineHeight: 1.6,
              color: "#a0a0a0",
              maxWidth: "600px",
            }}
          >
            A continuous, verifiable loop designed for enterprise engineering teams.
          </p>
        </div>

        {/* Step Track (Horizontal Stepper with Connected Lines) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "12px",
            marginBottom: "40px",
            position: "relative",
          }}
          className="workflow-steps-grid"
        >
          {steps.map((st, i) => {
            const isActive = activeStep === i;
            return (
              <div
                key={st.num}
                onClick={() => setActiveStep(i)}
                style={{
                  backgroundColor: isActive ? "#111111" : "#0a0a0a",
                  border: isActive ? "1px solid #ff2a1a" : "1px solid #1c1c1c",
                  borderRadius: "4px",
                  padding: "20px 16px",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "#0e0e0e";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "#0a0a0a";
                }}
              >
                {/* Step Number */}
                <div
                  style={{
                    fontFamily: "var(--cd-font-mono)",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isActive ? "#ff2a1a" : "#666666",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{st.num}</span>
                  {isActive && <span style={{ fontSize: "8px" }}>■ ACTIVE</span>}
                </div>

                {/* Step Title */}
                <h4
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: isActive ? "#ffffff" : "#cccccc",
                    marginBottom: "6px",
                  }}
                >
                  {st.title}
                </h4>

                <p
                  style={{
                    fontSize: "12px",
                    lineHeight: 1.5,
                    color: "#888888",
                    margin: 0,
                  }}
                >
                  {st.summary}
                </p>

                {/* Bottom Active Glow Bar */}
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-1px",
                      left: "0",
                      right: "0",
                      height: "2px",
                      backgroundColor: "#ff2a1a",
                      boxShadow: "0 0 10px #ff2a1a",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Deep Dive Inspector for the Selected Step */}
        <div
          style={{
            backgroundColor: "#0d0d0d",
            border: "1px solid #1f1f1f",
            borderRadius: "4px",
            padding: "36px",
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: "36px",
            alignItems: "center",
          }}
          className="workflow-inspector-grid"
        >
          <div>
            <div
              style={{
                fontFamily: "var(--cd-font-mono)",
                fontSize: "11px",
                color: "#ff2a1a",
                letterSpacing: "0.1em",
                marginBottom: "8px",
              }}
            >
              STEP {steps[activeStep].num} ARCHITECTURAL EXECUTION
            </div>
            <h3
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                marginBottom: "16px",
              }}
            >
              {steps[activeStep].title} Engine
            </h3>
            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.7,
                color: "#c0c0c0",
                marginBottom: "20px",
              }}
            >
              {steps[activeStep].detail}
            </p>
            <div
              style={{
                fontFamily: "var(--cd-font-mono)",
                fontSize: "11px",
                color: "#888888",
                backgroundColor: "#141414",
                border: "1px solid #222222",
                padding: "8px 14px",
                borderRadius: "3px",
                display: "inline-block",
              }}
            >
              {steps[activeStep].metric}
            </div>
          </div>

          {/* Interactive Code Console */}
          <div
            style={{
              backgroundColor: "#050505",
              border: "1px solid #242424",
              borderRadius: "4px",
              padding: "18px",
              fontFamily: "var(--cd-font-mono)",
              fontSize: "12px",
              color: "#f0f0f0",
              overflowX: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #1a1a1a",
                paddingBottom: "8px",
                marginBottom: "12px",
                fontSize: "11px",
                color: "#666666",
              }}
            >
              <span>EXECUTION LOG</span>
              <span style={{ color: "#10b981" }}>● CONNECTED</span>
            </div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "#a0a0a0", lineHeight: 1.6 }}>
              {steps[activeStep].codeSnippet}
            </pre>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .workflow-steps-grid {
            grid-template-columns: 1fr !important;
          }
          .workflow-inspector-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
