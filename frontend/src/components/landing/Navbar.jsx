import React, { useState } from "react";
import CloakLogo from "./CloakLogo";

export default function Navbar({ onOpenWorkspace, onNavigateSection }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Platform", target: "features" },
    { label: "Solutions", target: "why-synthetic" },
    { label: "Developers", target: "workflow" },
    { label: "Resources", target: "why-cloak" },
    { label: "Workspace", target: "workspace-preview" },
  ];

  const handleLinkClick = (target) => {
    setMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(target);
    } else {
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(5, 5, 5, 0.92)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--cd-border-subtle)",
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: "0 24px",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: Brand Logo */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ cursor: "pointer" }}
        >
          <CloakLogo size={26} wordmarkSize="17px" />
        </div>

        {/* Center: Desktop Navigation */}
        <div
          style={{
            display: "none",
            alignItems: "center",
            gap: "32px",
          }}
          className="desktop-nav"
        >
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleLinkClick(item.target)}
              style={{
                background: "none",
                border: "none",
                color: "#a0a0a0",
                fontSize: "14px",
                fontWeight: 500,
                letterSpacing: "-0.01em",
                padding: "6px 0",
                cursor: "pointer",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.target.style.color = "#a0a0a0")}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right: Workspace CTA Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            onClick={onOpenWorkspace}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#ff2a1a",
              color: "#ffffff",
              border: "1px solid #ff2a1a",
              borderRadius: "4px",
              padding: "9px 18px",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.02em",
              cursor: "pointer",
              boxShadow: "0 0 16px rgba(255, 42, 26, 0.25)",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e9271a";
              e.currentTarget.style.boxShadow = "0 0 22px rgba(255, 42, 26, 0.4)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ff2a1a";
              e.currentTarget.style.boxShadow = "0 0 16px rgba(255, 42, 26, 0.25)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span>Open Workspace</span>
            <span style={{ fontSize: "14px", lineHeight: 1 }}>→</span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: "none",
              background: "none",
              border: "1px solid var(--cd-border)",
              borderRadius: "4px",
              color: "#ffffff",
              padding: "7px 10px",
              fontSize: "16px",
            }}
            className="mobile-hamburger"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: "#0a0a0a",
            borderBottom: "1px solid var(--cd-border)",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleLinkClick(item.target)}
              style={{
                background: "none",
                border: "none",
                color: "#a0a0a0",
                fontSize: "15px",
                textAlign: "left",
                padding: "8px 0",
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenWorkspace();
            }}
            style={{
              marginTop: "8px",
              backgroundColor: "#ff2a1a",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              padding: "10px",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Open Workspace →
          </button>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-hamburger {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .mobile-hamburger {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
}
