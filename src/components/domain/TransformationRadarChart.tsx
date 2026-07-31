"use client";

import React from "react";

interface AreaScore {
  area: string;
  before: number; // 0 - 100
  after: number;  // 0 - 100
}

interface TransformationRadarChartProps {
  data?: AreaScore[];
  width?: number;
  height?: number;
  showLegend?: boolean;
}

const DEFAULT_AREAS: AreaScore[] = [
  { area: "Spiritual Growth", before: 62, after: 94 },
  { area: "Personal Development", before: 58, after: 88 },
  { area: "Leadership Excellence", before: 55, after: 91 },
  { area: "Relationship & Community", before: 60, after: 86 },
  { area: "Professional Impact", before: 64, after: 92 },
];

export function TransformationRadarChart({
  data = DEFAULT_AREAS,
  width = 450,
  height = 360,
  showLegend = true,
}: TransformationRadarChartProps) {
  const numSides = data.length;
  const radius = Math.min(width, height) / 2 - 50;
  const centerX = width / 2;
  const centerY = height / 2 - 10;

  // Calculates (x, y) coordinates for a value at a given index
  const getCoordinates = (index: number, valPercentage: number) => {
    const angle = (Math.PI * 2 / numSides) * index - Math.PI / 2;
    const distance = (valPercentage / 100) * radius;
    const x = centerX + distance * Math.cos(angle);
    const y = centerY + distance * Math.sin(angle);
    return { x, y };
  };

  // Helper to generate polygon SVG path string from value key ('before' or 'after')
  const getPolygonPath = (key: "before" | "after") => {
    return data
      .map((d, i) => {
        const { x, y } = getCoordinates(i, d[key]);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ") + " Z";
  };

  // Concentric background grid levels (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="relative w-full max-w-[480px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Background Concentric Polygon Grids */}
          {gridLevels.map((level) => {
            const levelPoints = data
              .map((_, i) => {
                const { x, y } = getCoordinates(i, level);
                return `${x},${y}`;
              })
              .join(" ");
            return (
              <polygon
                key={level}
                points={levelPoints}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth={level === 100 ? "1.5" : "1"}
                strokeDasharray={level === 100 ? "none" : "3 3"}
              />
            );
          })}

          {/* Radial Axis Lines from Center to Outer Vertices */}
          {data.map((_, i) => {
            const { x, y } = getCoordinates(i, 100);
            return (
              <line
                key={i}
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke="#CBD5E1"
                strokeWidth="1"
              />
            );
          })}

          {/* Layer 1: BEFORE (Baseline) - Muted Navy / Gray */}
          <path
            d={getPolygonPath("before")}
            fill="#64748B"
            fillOpacity="0.25"
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Layer 2: AFTER (Final 90 Days) - Vibrant Gold */}
          <path
            d={getPolygonPath("after")}
            fill="#C79A3C"
            fillOpacity="0.35"
            stroke="#D97706"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Before Data Dots */}
          {data.map((d, i) => {
            const { x, y } = getCoordinates(i, d.before);
            return (
              <circle
                key={`before-dot-${i}`}
                cx={x}
                cy={y}
                r="4"
                fill="#475569"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            );
          })}

          {/* After Data Dots */}
          {data.map((d, i) => {
            const { x, y } = getCoordinates(i, d.after);
            return (
              <g key={`after-dot-${i}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#0F1E3D"
                  stroke="#D97706"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={y - 8}
                  textAnchor="middle"
                  fill="#0F1E3D"
                  fontSize="10"
                  fontWeight="bold"
                  className="select-none"
                >
                  {d.after}%
                </text>
              </g>
            );
          })}

          {/* Area Labels around vertices */}
          {data.map((d, i) => {
            const { x, y } = getCoordinates(i, 118);
            let textAnchor: "start" | "middle" | "end" = "middle";
            if (x < centerX - 20) textAnchor = "end";
            else if (x > centerX + 20) textAnchor = "start";

            return (
              <text
                key={`label-${i}`}
                x={x}
                y={y}
                textAnchor={textAnchor}
                fontSize="11"
                fontWeight="700"
                fill="#0F1E3D"
                className="select-none font-sans"
              >
                {d.area}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex items-center justify-center gap-6 pt-3 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-slate-500 border border-slate-700 opacity-80" />
            <span className="text-slate-600">Before (Baseline)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-[#D97706] border border-[#0F1E3D]" />
            <span className="text-[#0F1E3D]">After (Final 90 Hari)</span>
          </div>
        </div>
      )}
    </div>
  );
}
