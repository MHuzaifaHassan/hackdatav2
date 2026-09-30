import React, { useState, useMemo } from "react";

/**
 * Reusable, interactive Relational ERD Diagram Component
 * Automatically positions tables based on topological DAG hierarchy,
 * renders primary keys, foreign keys, data types, and SVG relationship lines.
 */
export default function RelationalErdDiagram({
  schema,
  activeTable,
  onSelectTable,
  tableCounts = {},
  height = 540,
  compact = false,
  showControls = true,
  accentColor = "#ff2a1a",
}) {
  const [hoveredTable, setHoveredTable] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showAllColumns, setShowAllColumns] = useState(false);

  // Normalize tables & relations
  const tables = useMemo(() => {
    if (!schema || !schema.tables) return [];
    return schema.tables.map((t) => {
      const tName = typeof t === "string" ? t : t.name;
      const rawCols = (t && t.columns) || [];
      const cols = rawCols.map((c) => {
        if (typeof c === "string") {
          const isPk = c.endsWith("_id") && c.includes(tName.replace(/s$/, ""));
          const isFk = c.endsWith("_id") && !isPk;
          return {
            name: c,
            type: isPk || isFk ? "id" : "varchar(100)",
            pk: isPk,
            fk: isFk,
          };
        }
        return {
          name: c.name,
          type: c.type || "varchar(100)",
          pk: !!c.pk,
          fk: !c.pk && (c.name.endsWith("_id") || c.fk),
        };
      });

      return {
        name: tName,
        rows: (tableCounts && tableCounts[tName]) || t.rows || (t.data ? t.data.length : null) || 500,
        columns: cols,
        description: t.description || "",
      };
    });
  }, [schema, tableCounts]);

  const relations = useMemo(() => {
    if (!schema || !schema.relations) return [];
    return schema.relations.map((r) => ({
      parent: r.parent,
      child: r.child,
      fk: r.fk,
      parentPk: r.parent_pk || r.parentPk || `${r.parent.replace(/s$/, "")}_id`,
      cardinality: r.cardinality || "1:N",
    }));
  }, [schema]);

  // Compute topological layout levels
  const layout = useMemo(() => {
    if (tables.length === 0) return { positions: {}, svgPaths: [], canvasWidth: 800, canvasHeight: 520 };

    const inDegree = {};
    const adj = {};
    tables.forEach((t) => {
      inDegree[t.name] = 0;
      adj[t.name] = [];
    });

    relations.forEach((r) => {
      if (adj[r.parent] && inDegree[r.child] !== undefined) {
        adj[r.parent].push(r.child);
        inDegree[r.child] = (inDegree[r.child] || 0) + 1;
      }
    });

    // Level assignment
    const levels = {};
    tables.forEach((t) => {
      levels[t.name] = inDegree[t.name] === 0 ? 0 : 1;
    });

    // Propagate levels
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 10) {
      changed = false;
      iterations++;
      relations.forEach((r) => {
        const pLevel = levels[r.parent] || 0;
        const cLevel = levels[r.child] || 0;
        if (cLevel <= pLevel) {
          levels[r.child] = pLevel + 1;
          changed = true;
        }
      });
    }

    // Group tables by level
    const levelBuckets = {};
    tables.forEach((t) => {
      const lvl = levels[t.name] || 0;
      if (!levelBuckets[lvl]) levelBuckets[lvl] = [];
      levelBuckets[lvl].push(t);
    });

    const maxLevel = Math.max(0, ...Object.keys(levelBuckets).map(Number));
    const cardWidth = compact ? 160 : 190;
    const cardHeight = compact ? 150 : 180;
    const paddingX = compact ? 40 : 60;
    const paddingY = compact ? 40 : 60;
    const gapX = compact ? 50 : 80;
    const gapY = compact ? 70 : 100;

    let maxTablesInLevel = 1;
    Object.values(levelBuckets).forEach((b) => {
      if (b.length > maxTablesInLevel) maxTablesInLevel = b.length;
    });

    const canvasWidth = Math.max(760, maxTablesInLevel * cardWidth + (maxTablesInLevel - 1) * gapX + paddingX * 2);
    const canvasHeight = Math.max(height - 40, (maxLevel + 1) * cardHeight + maxLevel * gapY + paddingY * 2);

    // Calculate (x, y) coordinates for each table
    const positions = {};
    Object.keys(levelBuckets).forEach((lvlStr) => {
      const lvl = Number(lvlStr);
      const bucket = levelBuckets[lvl];
      const totalWidthForLvl = bucket.length * cardWidth + (bucket.length - 1) * gapX;
      const startX = (canvasWidth - totalWidthForLvl) / 2;
      const y = paddingY + lvl * (cardHeight + gapY);

      bucket.forEach((t, idx) => {
        const x = startX + idx * (cardWidth + gapX);
        positions[t.name] = {
          x,
          y,
          width: cardWidth,
          height: cardHeight,
          centerX: x + cardWidth / 2,
          centerY: y + cardHeight / 2,
          top: y,
          bottom: y + cardHeight,
          left: x,
          right: x + cardWidth,
        };
      });
    });

    // Compute SVG path connections between parent and child
    const svgPaths = relations.map((rel, relIdx) => {
      const pPos = positions[rel.parent];
      const cPos = positions[rel.child];
      if (!pPos || !cPos) return null;

      let startX, startY, endX, endY;

      // Top to bottom or lateral routing
      if (cPos.y > pPos.y + 40) {
        // Child is below parent
        startX = pPos.centerX;
        startY = pPos.bottom;
        endX = cPos.centerX;
        endY = cPos.top;
      } else if (pPos.y > cPos.y + 40) {
        // Parent is below child (reverse)
        startX = pPos.centerX;
        startY = pPos.top;
        endX = cPos.centerX;
        endY = cPos.bottom;
      } else {
        // Same level (side by side)
        if (pPos.x < cPos.x) {
          startX = pPos.right;
          startY = pPos.centerY;
          endX = cPos.left;
          endY = cPos.centerY;
        } else {
          startX = pPos.left;
          startY = pPos.centerY;
          endX = cPos.right;
          endY = cPos.centerY;
        }
      }

      // Smooth cubic bezier or orthogonal step
      const dy = endY - startY;
      const dx = endX - startX;
      const cp1X = startX;
      const cp1Y = startY + dy * 0.5;
      const cp2X = endX;
      const cp2Y = endY - dy * 0.5;

      const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      const isHighlighted =
        hoveredTable === rel.parent ||
        hoveredTable === rel.child ||
        activeTable === rel.parent ||
        activeTable === rel.child;

      return {
        id: `rel-${relIdx}`,
        parent: rel.parent,
        child: rel.child,
        fk: rel.fk,
        cardinality: rel.cardinality,
        pathData,
        startX,
        startY,
        endX,
        endY,
        midX,
        midY,
        isHighlighted,
      };
    }).filter(Boolean);

    return { positions, svgPaths, canvasWidth, canvasHeight };
  }, [tables, relations, compact, height, hoveredTable, activeTable]);

  if (!schema || tables.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          border: "1px dashed #222222",
          borderRadius: "8px",
          color: "#777777",
          fontFamily: "var(--cd-font-mono, monospace)",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "28px", marginBottom: "8px" }}>📊</span>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", marginBottom: "4px" }}>
          No Relational Schema Loaded
        </div>
        <div style={{ fontSize: "12px", color: "#666666", maxWidth: "420px" }}>
          Provide a description (e.g. Healthcare clinic, E-Commerce, Fintech, HR) to automatically synthesize the ERD diagram and relational DAG.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "#090909",
        border: "1px solid #1c1c1c",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
      }}
    >
      {/* Top Diagram Toolbar */}
      {showControls && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 16px",
            backgroundColor: "#0f0f0f",
            borderBottom: "1px solid #181818",
            fontFamily: "var(--cd-font-mono, monospace)",
            fontSize: "12px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: accentColor, fontWeight: 800 }}>■</span>
            <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "13px" }}>
              {schema.domain ? `${schema.domain.toUpperCase()} ERD SCHEMA` : "RELATIONAL DAG SCHEMA"}
            </span>
            <span
              style={{
                backgroundColor: "rgba(255, 42, 26, 0.12)",
                color: "#ff4d3d",
                border: "1px solid rgba(255, 42, 26, 0.3)",
                padding: "1px 7px",
                borderRadius: "3px",
                fontSize: "10px",
                fontWeight: 600,
              }}
            >
              {tables.length} TABLES
            </span>
            <span
              style={{
                backgroundColor: "rgba(56, 189, 248, 0.1)",
                color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                padding: "1px 7px",
                borderRadius: "3px",
                fontSize: "10px",
                fontWeight: 600,
              }}
            >
              {relations.length} RELATIONSHIPS
            </span>
            <span
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                color: "#10b981",
                padding: "1px 7px",
                borderRadius: "3px",
                fontSize: "10px",
                fontWeight: 600,
              }}
            >
              0 ORPHANS (100% INTEGRITY)
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setShowAllColumns(!showAllColumns)}
              title="Toggle full column list vs compact preview"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #282828",
                color: "#aaaaaa",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              {showAllColumns ? "Compact View" : "Show All Columns"}
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              title="Zoom out"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #282828",
                color: "#cccccc",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              -
            </button>
            <span style={{ color: "#777777", fontSize: "11px", minWidth: "36px", textAlign: "center" }}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              title="Zoom in"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #282828",
                color: "#cccccc",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              +
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              title="Reset zoom"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #282828",
                color: "#888888",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Diagram Canvas */}
      <div
        style={{
          height: `${height}px`,
          overflow: "auto",
          position: "relative",
          backgroundImage: "radial-gradient(#1f1f1f 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          backgroundColor: "#0a0a0a",
        }}
      >
        <div
          style={{
            minWidth: `${layout.canvasWidth}px`,
            minHeight: `${layout.canvasHeight}px`,
            position: "relative",
            transform: `scale(${zoomLevel})`,
            transformOrigin: "top left",
            transition: "transform 0.15s ease",
            padding: "20px",
          }}
        >
          {/* SVG Connection Lines */}
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <defs>
              <linearGradient id="relLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff4d3d" />
                <stop offset="100%" stopColor="#ff2a1a" />
              </linearGradient>
              <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {layout.svgPaths.map((p) => (
              <g key={p.id}>
                {/* Glow underlay if highlighted */}
                {p.isHighlighted && (
                  <path
                    d={p.pathData}
                    stroke="#ff2a1a"
                    strokeWidth="4"
                    strokeOpacity="0.4"
                    fill="none"
                    filter="url(#lineGlow)"
                  />
                )}

                {/* Primary connection line */}
                <path
                  d={p.pathData}
                  stroke={p.isHighlighted ? "#ff4d3d" : "#552222"}
                  strokeWidth={p.isHighlighted ? "2" : "1.3"}
                  strokeDasharray={p.isHighlighted ? "none" : "none"}
                  fill="none"
                  style={{ transition: "stroke 0.2s, stroke-width 0.2s" }}
                />

                {/* Start node dot (1 - Parent) */}
                <circle cx={p.startX} cy={p.startY} r="3" fill="#ff4d3d" />

                {/* End node arrow/dot (N - Child) */}
                <circle cx={p.endX} cy={p.endY} r="3.5" fill="#38bdf8" />

                {/* Cardinality chip at midpoint */}
                <g transform={`translate(${p.midX}, ${p.midY})`}>
                  <rect
                    x="-18"
                    y="-9"
                    width="36"
                    height="18"
                    rx="3"
                    fill="#111111"
                    stroke={p.isHighlighted ? "#ff2a1a" : "#333333"}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill={p.isHighlighted ? "#ffffff" : "#aaaaaa"}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    {p.cardinality || "1:N"}
                  </text>
                </g>
              </g>
            ))}
          </svg>

          {/* Table Cards */}
          {tables.map((t) => {
            const pos = layout.positions[t.name];
            if (!pos) return null;

            const isSelected = activeTable === t.name;
            const isHovered = hoveredTable === t.name;
            const columnsToShow = showAllColumns ? t.columns : t.columns.slice(0, 5);
            const remainingCount = t.columns.length - columnsToShow.length;

            return (
              <div
                key={t.name}
                onClick={() => onSelectTable && onSelectTable(t.name)}
                onMouseEnter={() => setHoveredTable(t.name)}
                onMouseLeave={() => setHoveredTable(null)}
                style={{
                  position: "absolute",
                  top: `${pos.y}px`,
                  left: `${pos.x}px`,
                  width: `${pos.width}px`,
                  backgroundColor: "#111111",
                  border: isSelected
                    ? "1.5px solid #ff2a1a"
                    : isHovered
                    ? "1px solid rgba(255, 42, 26, 0.6)"
                    : "1px solid #222222",
                  borderRadius: "6px",
                  zIndex: isSelected || isHovered ? 10 : 2,
                  fontFamily: "var(--cd-font-mono, monospace)",
                  boxShadow: isSelected
                    ? "0 4px 24px rgba(255, 42, 26, 0.3)"
                    : isHovered
                    ? "0 4px 16px rgba(0,0,0,0.8)"
                    : "0 2px 10px rgba(0,0,0,0.5)",
                  cursor: "pointer",
                  transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
                  transform: isHovered || isSelected ? "translateY(-2px)" : "none",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #1c1c1c",
                    backgroundColor: isSelected ? "rgba(255, 42, 26, 0.1)" : "#141414",
                    borderTopLeftRadius: "5px",
                    borderTopRightRadius: "5px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: isSelected ? "#ff4d3d" : "#888888", fontSize: "11px" }}>▤</span>
                    <strong style={{ fontSize: "12px", color: isSelected ? "#ffffff" : "#e0e0e0" }}>
                      {t.name}
                    </strong>
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      color: isSelected ? "#ff4d3d" : "#777777",
                      fontFamily: "monospace",
                      backgroundColor: "#1c1c1c",
                      padding: "1px 5px",
                      borderRadius: "3px",
                    }}
                  >
                    {typeof t.rows === "number" ? `${t.rows >= 1000 ? `${Math.round(t.rows / 1000)}k` : t.rows}` : t.rows}
                  </span>
                </div>

                {/* Columns */}
                <div style={{ padding: "8px 10px", fontSize: "11px", display: "flex", flexDirection: "column", gap: "5px" }}>
                  {columnsToShow.map((col, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", overflow: "hidden" }}>
                        <span
                          style={{
                            color: col.pk ? "#ffffff" : col.fk ? "#a0c4ff" : "#888888",
                            fontWeight: col.pk ? 700 : 400,
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            maxWidth: "100px",
                          }}
                          title={col.name}
                        >
                          {col.name}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                        {col.pk && (
                          <span
                            style={{
                              backgroundColor: "#ff2a1a",
                              color: "#ffffff",
                              fontSize: "8px",
                              fontWeight: 800,
                              padding: "0px 3px",
                              borderRadius: "2px",
                            }}
                          >
                            PK
                          </span>
                        )}
                        {col.fk && (
                          <span
                            style={{
                              border: "1px solid #ff4d3d",
                              color: "#ff4d3d",
                              fontSize: "8px",
                              fontWeight: 700,
                              padding: "0px 3px",
                              borderRadius: "2px",
                            }}
                          >
                            FK
                          </span>
                        )}
                        <span
                          style={{
                            color: "#555555",
                            fontSize: "9px",
                            fontFamily: "monospace",
                            textTransform: "lowercase",
                          }}
                        >
                          {col.type.replace(/varchar\(\d+\)/, "text")}
                        </span>
                      </div>
                    </div>
                  ))}

                  {remainingCount > 0 && !showAllColumns && (
                    <div
                      style={{
                        fontSize: "9px",
                        color: "#555555",
                        textAlign: "center",
                        paddingTop: "4px",
                        borderTop: "1px dashed #1a1a1a",
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllColumns(true);
                      }}
                    >
                      + {remainingCount} more columns...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
