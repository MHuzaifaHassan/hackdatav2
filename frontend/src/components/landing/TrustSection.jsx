import React, { useState } from "react";

export default function TrustSection() {
  const [activeCategory, setActiveCategory] = useState("VALIDATE");

  const roles = [
    "AI Engineers",
    "Developers",
    "Analytics Teams",
    "Researchers",
    "QA & Testing",
    "Data Scientists",
    "MLOps Teams",
    "Security Architects",
  ];

  return (
    <section
      style={{
        backgroundColor: "#050505",
        borderBottom: "1px solid var(--cd-border-subtle)",
        padding: "80px 0 60px 0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: "0 24px",
          marginBottom: "48px",
        }}
      >
        {/* Large Statement (Matching Reference Screenshot 2) */}
        <h2
          style={{
            fontSize: "clamp(38px, 5.5vw, 76px)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            color: "#ffffff",
          }}
        >
          Built for modern <br />
          data <span style={{ color: "#ff2a1a" }}>teams.</span>
        </h2>
      </div>

      {/* Full-bleed Infinite Marquee Banner */}
      <div
        style={{
          width: "100%",
          overflow: "hidden",
          borderTop: "1px solid #181818",
          borderBottom: "1px solid #181818",
          padding: "24px 0",
          backgroundColor: "#080808",
          position: "relative",
        }}
      >
        {/* Primary Marquee Row */}
        <div className="animate-marquee" style={{ display: "flex", gap: "40px", alignItems: "center" }}>
          {[...roles, ...roles, ...roles].map((role, idx) => (
            <div
              key={idx}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "28px",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontSize: "clamp(24px, 3.2vw, 42px)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "#ffffff",
                }}
              >
                {role}
              </span>
              <span
                style={{
                  color: "#ff2a1a",
                  fontSize: "12px",
                  lineHeight: 1,
                }}
              >
                ■
              </span>
            </div>
          ))}
        </div>

        {/* Ghosted / Outlined Secondary Row Beneath for Editorial Depth (Matching Screenshot 2) */}
        <div
          className="animate-marquee"
          style={{
            display: "flex",
            gap: "40px",
            alignItems: "center",
            marginTop: "10px",
            opacity: 0.18,
            animationDirection: "reverse",
          }}
        >
          {[...roles, ...roles, ...roles].map((role, idx) => (
            <div
              key={idx}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "28px",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontSize: "clamp(20px, 2.6vw, 36px)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "#ffffff",
                  WebkitTextStroke: "1px #ffffff",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {role}
              </span>
              <span style={{ color: "#666666", fontSize: "10px" }}>■</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-bar statement and Category Badges (Matching Screenshot 2) */}
      <div
        style={{
          maxWidth: "1320px",
          margin: "36px auto 0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <p
          style={{
            fontSize: "16px",
            color: "#ffffff",
            fontWeight: 500,
            letterSpacing: "-0.01em",
            maxWidth: "600px",
          }}
        >
          One platform for <span style={{ color: "#ff2a1a", fontWeight: 700 }}>generating</span>,
          profiling, validating, and working with synthetic data.
        </p>

        {/* Feature Category Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {["GENERATE", "ANALYZE", "VALIDATE"].map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  fontFamily: "var(--cd-font-mono)",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  padding: "6px 12px",
                  borderRadius: "2px",
                  border: isSelected ? "1px solid #ff2a1a" : "1px solid #222222",
                  backgroundColor: isSelected ? "#140807" : "#0d0d0d",
                  color: isSelected ? "#ff2a1a" : "#777777",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {isSelected && <span style={{ fontSize: "8px" }}>■</span>}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
