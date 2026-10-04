import React from "react";

export default function FinalCTA({ onEnterWorkspace }) {
  return (
    <section
      style={{
        backgroundColor: "#050505",
        borderBottom: "1px solid var(--cd-border-subtle)",
        padding: "120px 0",
        position: "relative",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* Background Radial Glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(circle, rgba(255, 42, 26, 0.12) 0%, transparent 70%)",
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 2 }}>
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
          START SYNTHESIZING
        </div>

        <h2
          style={{
            fontSize: "clamp(44px, 6vw, 84px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            color: "#ffffff",
            marginBottom: "20px",
          }}
        >
          Your synthetic <br />
          <span style={{ color: "#ff2a1a" }}>data workspace.</span>
        </h2>

        <p
          style={{
            fontSize: "20px",
            color: "#cccccc",
            marginBottom: "40px",
            letterSpacing: "-0.01em",
            fontWeight: 500,
          }}
        >
          Generate. Validate. Explore.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
          <button
            onClick={onEnterWorkspace}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "#ff2a1a",
              color: "#ffffff",
              border: "1px solid #ff2a1a",
              borderRadius: "4px",
              padding: "16px 36px",
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "0.02em",
              cursor: "pointer",
              boxShadow: "0 4px 32px rgba(255, 42, 26, 0.4)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e9271a";
              e.currentTarget.style.boxShadow = "0 6px 40px rgba(255, 42, 26, 0.55)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ff2a1a";
              e.currentTarget.style.boxShadow = "0 4px 32px rgba(255, 42, 26, 0.4)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span>Enter Workspace</span>
            <span style={{ fontSize: "18px" }}>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
