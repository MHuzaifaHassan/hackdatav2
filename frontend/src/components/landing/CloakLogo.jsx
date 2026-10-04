import React from "react";

export default function CloakLogo({ size = 28, showWordmark = true, wordmarkSize = "18px" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", userSelect: "none" }}>
      {/* Geometric Isometric Cloak Cube Logo */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Outer Hexagon / Isometric Wireframe Cube */}
        <path
          d="M16 2L29 9.5V24.5L16 32L3 24.5V9.5L16 2Z"
          stroke="#444444"
          strokeWidth="1.5"
          fill="#0c0c0c"
        />
        {/* Internal Y-Axis Lines (Isometric Cube Edges) */}
        <path d="M16 2V17" stroke="#333333" strokeWidth="1.2" />
        <path d="M16 17L29 24.5" stroke="#333333" strokeWidth="1.2" />
        <path d="M16 17L3 24.5" stroke="#333333" strokeWidth="1.2" />

        {/* Central Glowing Red Core Block */}
        <path
          d="M16 10L22 13.5V20.5L16 24L10 20.5V13.5L16 10Z"
          fill="#FF2A1A"
        />
        {/* Shading on right face of core block */}
        <path
          d="M16 17L22 13.5V20.5L16 24V17Z"
          fill="#D61F10"
        />
        {/* Shading on bottom left face */}
        <path
          d="M16 17L10 20.5V13.5L16 10V17Z"
          fill="#B8180C"
        />
        {/* Top facet highlight */}
        <path
          d="M16 10L22 13.5L16 17L10 13.5L16 10Z"
          fill="#FF4436"
        />
      </svg>

      {showWordmark && (
        <span
          style={{
            fontFamily: "var(--cd-font-sans)",
            fontWeight: 800,
            fontSize: wordmarkSize,
            letterSpacing: "0.08em",
            color: "#ffffff",
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#ff2a1a" }}>CLOAK</span><span style={{ color: "#ffffff" }}>DATA</span>
        </span>
      )}
    </div>
  );
}
