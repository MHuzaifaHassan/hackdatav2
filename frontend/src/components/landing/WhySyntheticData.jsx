import React, { useState } from "react";

export default function WhySyntheticData() {
  const [scrollIndex, setScrollIndex] = useState(0);

  const benefits = [
    {
      id: "01",
      title: "Privacy",
      desc: "Reduce direct exposure to sensitive real-world records during development and testing.",
      details: "Prevent exposure of personally identifiable information (PII) by creating mathematically synthesized records that mirror underlying distributions without reproducing raw individuals.",
      badge: "GOVERNANCE",
    },
    {
      id: "02",
      title: "Scalability",
      desc: "Generate large volumes of data on demand without depending entirely on real records.",
      details: "Scale from small reference samples to millions of coherent rows across relational tables to stress-test data lakes, queries, and ETL pipelines under load.",
      badge: "DATA PIPELINES",
    },
    {
      id: "03",
      title: "AI Development",
      desc: "Create representative datasets for experimentation, evaluation, and model development.",
      details: "Train and benchmark machine learning models with realistic feature correlations, ensuring training runs are decoupled from live customer databases.",
      badge: "MACHINE LEARNING",
    },
    {
      id: "04",
      title: "Testing",
      desc: "Generate controlled data for application, API, database, and workflow testing.",
      details: "Simulate edge cases, stress scenarios, rare schema conditions, and boundary conditions deterministically using configurable random seeds.",
      badge: "QA & RELIABILITY",
    },
    {
      id: "05",
      title: "Data Augmentation",
      desc: "Expand datasets with additional synthetic examples when suitable.",
      details: "Synthesize under-represented minority classes and operational scenarios to balance training distributions and validate classifier fairness.",
      badge: "AUGMENTATION",
    },
    {
      id: "06",
      title: "Collaboration",
      desc: "Share representative datasets with teams without automatically sharing original records.",
      details: "Accelerate cross-functional vendor evaluations, contractor onboarding, and multi-team research without complex multi-month compliance review gates.",
      badge: "COLLABORATION",
    },
  ];

  const handlePrev = () => {
    setScrollIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setScrollIndex((prev) => Math.min(benefits.length - 3, prev + 1));
  };

  return (
    <section
      id="why-synthetic"
      style={{
        backgroundColor: "#080808",
        borderBottom: "1px solid var(--cd-border-subtle)",
        padding: "100px 0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "0 24px" }}>
        {/* Editorial Header & Carousel Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "52px",
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
              VALUE PILLARS
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
              Why synthetic <span style={{ color: "#ff2a1a" }}>data?</span>
            </h2>
            <p
              style={{
                fontSize: "17px",
                lineHeight: 1.6,
                color: "#a0a0a0",
                maxWidth: "600px",
              }}
            >
              Build, test, and experiment with realistic data while reducing
              unnecessary exposure to sensitive information.
            </p>
          </div>

          {/* Carousel Arrows */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handlePrev}
              disabled={scrollIndex === 0}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "4px",
                backgroundColor: "#111111",
                border: "1px solid #222222",
                color: scrollIndex === 0 ? "#444444" : "#ffffff",
                fontSize: "18px",
                cursor: scrollIndex === 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
            >
              ←
            </button>
            <button
              onClick={handleNext}
              disabled={scrollIndex >= benefits.length - 3}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "4px",
                backgroundColor: "#111111",
                border: "1px solid #222222",
                color: scrollIndex >= benefits.length - 3 ? "#444444" : "#ffffff",
                fontSize: "18px",
                cursor: scrollIndex >= benefits.length - 3 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
            >
              →
            </button>
          </div>
        </div>

        {/* Carousel Grid Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
          }}
          className="why-cards-grid"
        >
          {benefits.slice(scrollIndex, scrollIndex + 3).map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: "#0d0d0d",
                border: "1px solid #1c1c1c",
                borderRadius: "4px",
                padding: "36px 30px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "340px",
                position: "relative",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 42, 26, 0.4)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.backgroundColor = "#111111";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1c1c1c";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.backgroundColor = "#0d0d0d";
              }}
            >
              {/* Card Top */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--cd-font-mono)",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#ff2a1a",
                    }}
                  >
                    {item.id}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--cd-font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.1em",
                      color: "#777777",
                      border: "1px solid #222222",
                      padding: "3px 8px",
                      borderRadius: "2px",
                    }}
                  >
                    {item.badge}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "#ffffff",
                    marginBottom: "14px",
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.6,
                    color: "#f0f0f0",
                    fontWeight: 500,
                    marginBottom: "14px",
                  }}
                >
                  "{item.desc}"
                </p>

                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: "#777777",
                  }}
                >
                  {item.details}
                </p>
              </div>

              {/* Card Bottom Indicator Line */}
              <div
                style={{
                  width: "100%",
                  height: "2px",
                  backgroundColor: "#181818",
                  marginTop: "24px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "2px",
                    backgroundColor: "#ff2a1a",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .why-cards-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
