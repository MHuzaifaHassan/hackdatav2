import React from "react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import TrustSection from "./TrustSection";
import CoreFeatures from "./CoreFeatures";
import WhySyntheticData from "./WhySyntheticData";
import WorkflowSection from "./WorkflowSection";
import WhyCloakData from "./WhyCloakData";
import WorkspacePreview from "./WorkspacePreview";
import FinalCTA from "./FinalCTA";
import Footer from "./Footer";

export default function LandingPage({ onOpenWorkspace }) {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div style={{ backgroundColor: "#050505", minHeight: "100vh", color: "#ffffff" }}>
      {/* 1. Minimal Premium Navbar */}
      <Navbar
        onOpenWorkspace={() => onOpenWorkspace("relational")}
        onNavigateSection={scrollTo}
      />

      {/* 2. Hero Section with 3D Abstract Data Environment */}
      <Hero
        onExplore={() => scrollTo("features")}
        onOpenWorkspace={() => onOpenWorkspace("relational")}
      />

      {/* 3. Trust / Platform Intro Section */}
      <TrustSection />

      {/* 4. Core Features Showcase (Tabular, Relational, Docs, Profiler, Tester) */}
      <CoreFeatures
        onOpenWorkspace={() => onOpenWorkspace("tabular")}
      />

      {/* 5. Why Synthetic Data (Benefits Carousel) */}
      <WhySyntheticData />

      {/* 6. CLOAKDATA Workflow */}
      <WorkflowSection />

      {/* 7. Why CLOAKDATA (4 Pillars) */}
      <WhyCloakData
        onOpenWorkspace={() => onOpenWorkspace("relational")}
      />

      {/* 8. Workspace Preview */}
      <WorkspacePreview
        onEnterWorkspace={() => onOpenWorkspace("relational")}
      />

      {/* 9. Final CTA */}
      <FinalCTA
        onEnterWorkspace={() => onOpenWorkspace("relational")}
      />

      {/* 10. Footer */}
      <Footer
        onOpenWorkspace={() => onOpenWorkspace("relational")}
        onNavigateSection={scrollTo}
      />
    </div>
  );
}
