import React, { useState, useEffect } from "react";

export default function Hero({ onExplore, onOpenWorkspace }) {
  const headlineCycles = [
    {
      line1: "Synthetic data.",
      line2: "Without the sensitive data.",
      accentWord: "Without",
    },
    {
      line1: "Privacy-preserving data.",
      line2: "Without the compliance risk.",
      accentWord: "Without",
    },
    {
      line1: "Realistic test data.",
      line2: "Without production exposure.",
      accentWord: "Without",
    },
    {
      line1: "AI-ready datasets.",
      line2: "Without privacy leaks.",
      accentWord: "Without",
    },
    {
      line1: "Enterprise data generation.",
      line2: "Without real-world liability.",
      accentWord: "Without",
    },
  ];

  const [cycleIndex, setCycleIndex] = useState(0);
  const [fadeState, setFadeState] = useState("in");

  useEffect(() => {
    const timer = setInterval(() => {
      setFadeState("out");
      setTimeout(() => {
        setCycleIndex((prev) => (prev + 1) % headlineCycles.length);
        setFadeState("in");
      }, 300);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const currentCycle = headlineCycles[cycleIndex];

  // Demo bar chart values for Income (Synthetic vs Real)
  const barData = [
    { syn: 18, real: 14 },
    { syn: 32, real: 28 },
    { syn: 55, real: 50 },
    { syn: 82, real: 78 },
    { syn: 95, real: 90 },
    { syn: 74, real: 70 },
    { syn: 48, real: 45 },
    { syn: 26, real: 22 },
    { syn: 12, real: 15 },
  ];

  return (
    <section
      style={{
        position: "relative",
        minHeight: "calc(100vh - 68px)",
        display: "flex",
        alignItems: "center",
        backgroundColor: "#050505",
        overflow: "hidden",
        borderBottom: "1px solid var(--cd-border-subtle)",
        padding: "60px 0 80px 0",
      }}
    >
      {/* Background Subtle Tech Grid */}
      <div
        className="tech-grid-bg"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.7,
          pointerEvents: "none",
        }}
      />

      {/* Ambient Red Glow in Background Center-Right */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          right: "20%",
          width: "480px",
          height: "480px",
          background: "radial-gradient(circle, rgba(255, 42, 26, 0.12) 0%, rgba(255, 42, 26, 0.02) 60%, transparent 80%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: "0 24px",
          width: "100%",
          position: "relative",
          zIndex: 2,
          display: "grid",
          gridTemplateColumns: "1.05fr 0.95fr",
          alignItems: "center",
          gap: "48px",
        }}
        className="hero-grid"
      >
        {/* Left Column: Editorial Headline & Actions */}
        <div>
          {/* Eyebrow / Tag */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--cd-font-mono)",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "#ff2a1a",
              textTransform: "uppercase",
              marginBottom: "20px",
            }}
          >
            <span style={{ fontSize: "10px", lineHeight: 1 }}>■</span>
            <span>ENTERPRISE DATA GENERATION</span>
          </div>

          {/* Massive Wordmark Headline */}
          <h1
            style={{
              fontSize: "clamp(52px, 7vw, 92px)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
              color: "#ffffff",
              marginBottom: "28px",
              textTransform: "uppercase",
            }}
          >
            CLOAKDATA
          </h1>

          {/* Cycling Subtitle Statement */}
          <div
            style={{
              minHeight: "96px",
              marginBottom: "24px",
              transition: "opacity 0.3s ease, transform 0.3s ease",
              opacity: fadeState === "in" ? 1 : 0,
              transform: fadeState === "in" ? "translateY(0)" : "translateY(6px)",
            }}
          >
            <h2
              style={{
                fontSize: "clamp(24px, 3.2vw, 40px)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                color: "#ffffff",
              }}
            >
              {currentCycle.line1}
              <br />
              <span style={{ color: "#ff2a1a" }}>{currentCycle.line2}</span>
            </h2>
          </div>

          {/* Supporting Text */}
          <p
            style={{
              fontSize: "17px",
              lineHeight: 1.65,
              color: "#a0a0a0",
              maxWidth: "520px",
              marginBottom: "38px",
              fontWeight: 400,
            }}
          >
            Generate, understand, validate, and test realistic synthetic datasets for
            modern AI, analytics, development, and enterprise workflows.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <button
              onClick={onExplore}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "#ff2a1a",
                color: "#ffffff",
                border: "1px solid #ff2a1a",
                borderRadius: "4px",
                padding: "14px 28px",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.02em",
                cursor: "pointer",
                boxShadow: "0 4px 24px rgba(255, 42, 26, 0.3)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e9271a";
                e.currentTarget.style.boxShadow = "0 6px 30px rgba(255, 42, 26, 0.45)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ff2a1a";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(255, 42, 26, 0.3)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span>Explore Platform</span>
              <span style={{ fontSize: "16px" }}>→</span>
            </button>

            <button
              onClick={onOpenWorkspace}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "#0d0d0d",
                color: "#ffffff",
                border: "1px solid #282828",
                borderRadius: "4px",
                padding: "14px 28px",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.02em",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#444444";
                e.currentTarget.style.backgroundColor = "#141414";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#282828";
                e.currentTarget.style.backgroundColor = "#0d0d0d";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span>Open Workspace</span>
              <span style={{ fontSize: "16px", color: "#a0a0a0" }}>→</span>
            </button>
          </div>
        </div>

        {/* Right Column: Abstract Data Environment Visualization (matching reference screenshot 1) */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "480px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="hero-visual"
        >
          {/* Main SVG Data Environment */}
          <svg
            viewBox="0 0 540 460"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "100%", height: "100%", overflow: "visible" }}
          >
            {/* Background Isometric Perspective Grid Lines */}
            <g opacity="0.25">
              <line x1="40" y1="230" x2="270" y2="100" stroke="#333333" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="270" y1="100" x2="500" y2="230" stroke="#333333" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="500" y1="230" x2="270" y2="360" stroke="#333333" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="270" y1="360" x2="40" y2="230" stroke="#333333" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="150" y1="230" x2="270" y2="160" stroke="#222222" strokeWidth="1" />
              <line x1="270" y1="160" x2="390" y2="230" stroke="#222222" strokeWidth="1" />
              <line x1="390" y1="230" x2="270" y2="300" stroke="#222222" strokeWidth="1" />
              <line x1="270" y1="300" x2="150" y2="230" stroke="#222222" strokeWidth="1" />
            </g>

            {/* Glowing Connection Traces to Nodes */}
            {/* Trace to "customers" (top-left) */}
            <path
              d="M270 230L170 170L150 110"
              stroke="#ff2a1a"
              strokeWidth="1.2"
              strokeDasharray="4 3"
              opacity="0.8"
            />
            {/* Trace to "schema" (top-right) */}
            <path
              d="M270 230L340 160L390 120"
              stroke="#444444"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {/* Trace to "orders" (far right) */}
            <path
              d="M270 230L420 200L480 150"
              stroke="#444444"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {/* Trace to "payments" (bottom-left) */}
            <path
              d="M270 230L210 320L220 370"
              stroke="#ff2a1a"
              strokeWidth="1.2"
              strokeDasharray="4 3"
              opacity="0.8"
            />

            {/* Outer Isometric Wireframe Cube around core */}
            <g className="animate-float" style={{ transformOrigin: "270px 230px" }}>
              <polygon
                points="270,140 360,190 360,290 270,340 180,290 180,190"
                stroke="#ff2a1a"
                strokeWidth="1.2"
                strokeOpacity="0.4"
                fill="none"
              />
              <line x1="270" y1="140" x2="270" y2="240" stroke="#ff2a1a" strokeWidth="1" strokeOpacity="0.3" />
              <line x1="360" y1="190" x2="270" y2="240" stroke="#ff2a1a" strokeWidth="1" strokeOpacity="0.3" />
              <line x1="180" y1="190" x2="270" y2="240" stroke="#ff2a1a" strokeWidth="1" strokeOpacity="0.3" />

              {/* Central Glowing Red Solid Core Cube */}
              <g>
                {/* Top face */}
                <polygon points="270,190 310,212 270,234 230,212" fill="#ff4d3f" />
                {/* Right face */}
                <polygon points="270,234 310,212 310,258 270,280" fill="#e9271a" />
                {/* Left face */}
                <polygon points="270,234 230,212 230,258 270,280" fill="#b8180c" />
                {/* Core edge highlights */}
                <polygon
                  points="270,190 310,212 310,258 270,280 230,258 230,212"
                  stroke="#ffffff"
                  strokeWidth="0.8"
                  strokeOpacity="0.3"
                  fill="none"
                />
              </g>

              {/* Subtle pulsing red radial halo around core */}
              <circle cx="270" cy="235" r="55" fill="url(#coreGlow)" opacity="0.6" />
            </g>

            {/* Gradient definition for core glow */}
            <defs>
              <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ff2a1a" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#ff2a1a" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#ff2a1a" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Floating Satellite Nodes with Labels */}
            {/* 1. Node: Customers (Top-Left) */}
            <g transform="translate(140, 100)">
              <circle cx="0" cy="0" r="4" fill="#ff2a1a" />
              <circle cx="0" cy="0" r="8" stroke="#ff2a1a" strokeWidth="1" opacity="0.5" />
              {/* Floating mini red cube */}
              <polygon points="60,-15 72,-8 72,4 60,-3" fill="#e9271a" />
              <polygon points="60,-15 48,-8 48,4 60,-3" fill="#b8180c" />
              <polygon points="60,-15 72,-8 60,-1 48,-8" fill="#ff4d3f" />
              <text
                x="5"
                y="-10"
                fill="#a0a0a0"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fontWeight="500"
              >
                customers
              </text>
            </g>

            {/* 2. Node: Schema (Top-Right) */}
            <g transform="translate(390, 115)">
              <circle cx="0" cy="0" r="4" fill="#666666" />
              <circle cx="0" cy="0" r="7" stroke="#444444" strokeWidth="1" />
              <text
                x="12"
                y="-4"
                fill="#a0a0a0"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fontWeight="500"
              >
                schema
              </text>
            </g>

            {/* 3. Node: Orders (Far-Right) */}
            <g transform="translate(480, 145)">
              <circle cx="0" cy="0" r="4" fill="#ff2a1a" />
              <circle cx="0" cy="0" r="8" stroke="#ff2a1a" strokeWidth="1" opacity="0.6" />
              <text
                x="-36"
                y="-12"
                fill="#a0a0a0"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fontWeight="500"
              >
                orders
              </text>
            </g>

            {/* 4. Node: Payments (Bottom-Left) */}
            <g transform="translate(220, 375)">
              <circle cx="0" cy="0" r="4" fill="#ff2a1a" />
              <circle cx="0" cy="0" r="8" stroke="#ff2a1a" strokeWidth="1" opacity="0.6" />
              <text
                x="14"
                y="4"
                fill="#a0a0a0"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fontWeight="500"
              >
                payments
              </text>
            </g>

            {/* Floating Dark Data Blocks */}
            {/* Dark block 1 */}
            <g transform="translate(370, 230)">
              <polygon points="0,-12 12,-5 12,9 0,2" fill="#222222" />
              <polygon points="0,-12 -12,-5 -12,9 0,2" fill="#181818" />
              <polygon points="0,-12 12,-5 0,2 -12,-5" fill="#303030" />
            </g>
            {/* Dark block 2 */}
            <g transform="translate(190, 250)">
              <polygon points="0,-10 10,-4 10,8 0,2" fill="#222222" />
              <polygon points="0,-10 -10,-4 -10,8 0,2" fill="#181818" />
              <polygon points="0,-10 10,-4 0,2 -10,-4" fill="#2a2a2a" />
            </g>
            {/* Small red floating data block */}
            <g transform="translate(450, 280)">
              <polygon points="0,-8 8,-3 8,7 0,2" fill="#e9271a" />
              <polygon points="0,-8 -8,-3 -8,7 0,2" fill="#b8180c" />
              <polygon points="0,-8 8,-3 0,2 -8,-3" fill="#ff4d3f" />
            </g>
          </svg>

          {/* Bottom Right Mini Distribution Chart Card (Matching reference screenshot 1) */}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              right: "12px",
              backgroundColor: "#0d0d0d",
              border: "1px solid #222222",
              borderRadius: "4px",
              padding: "12px 16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              minWidth: "220px",
            }}
          >
            {/* Card Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontFamily: "var(--cd-font-mono)",
                fontSize: "10px",
                letterSpacing: "0.1em",
                marginBottom: "10px",
              }}
            >
              <span style={{ color: "#ffffff", fontWeight: 700 }}>INCOME</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ color: "#ff2a1a", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "8px" }}>■</span> SYNTHETIC
                </span>
                <span style={{ color: "#555555", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "8px" }}>■</span> REAL
                </span>
              </div>
            </div>

            {/* Distribution Bars */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "6px",
                height: "44px",
                paddingTop: "4px",
              }}
            >
              {barData.map((d, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    gap: "2px",
                    alignItems: "flex-end",
                    height: "100%",
                  }}
                  title={`Bucket ${i + 1}: Synthetic ${d.syn}% vs Real ${d.real}%`}
                >
                  {/* Real bar (gray) */}
                  <div
                    style={{
                      width: "50%",
                      height: `${d.real}%`,
                      backgroundColor: "#333333",
                      borderRadius: "1px 1px 0 0",
                    }}
                  />
                  {/* Synthetic bar (red) */}
                  <div
                    style={{
                      width: "50%",
                      height: `${d.syn}%`,
                      backgroundColor: "#ff2a1a",
                      borderRadius: "1px 1px 0 0",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
          .hero-visual {
            height: 360px !important;
          }
        }
      `}</style>
    </section>
  );
}
