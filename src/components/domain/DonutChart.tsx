"use client";

import React from "react";

interface DonutSegment {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

interface DonutChartProps {
  segments?: DonutSegment[];
  totalLabel?: string;
  totalCount?: number;
  size?: number;
}

const DEFAULT_SEGMENTS: DonutSegment[] = [
  { label: "Selesai (Completed)", count: 18, percentage: 72, color: "#10B981" },
  { label: "Dalam Progres (On-Track)", count: 5, percentage: 20, color: "#F59E0B" },
  { label: "Perlu Perhatian (Needs Attention)", count: 2, percentage: 8, color: "#EF4444" },
];

export function DonutChart({
  segments = DEFAULT_SEGMENTS,
  totalLabel = "Total Peserta",
  totalCount = 25,
  size = 200,
}: DonutChartProps) {
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
      {/* Donut SVG Chart */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg, idx) => {
            const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativeOffset;
            cumulativeOffset += (seg.percentage / 100) * circumference;

            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 hover:opacity-90"
              />
            );
          })}
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-2xl font-black text-[#0F1E3D] leading-none">{totalCount}</span>
          <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tight">
            {totalLabel}
          </span>
        </div>
      </div>

      {/* Legend & Breakdown Cards */}
      <div className="space-y-2.5 w-full max-w-xs">
        {segments.map((seg, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
          >
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="font-bold text-slate-700">{seg.label}</span>
            </div>
            <div className="text-right">
              <span className="font-black text-[#0F1E3D]">{seg.count} Orang</span>
              <span className="text-[10px] text-slate-500 font-bold block">({seg.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
