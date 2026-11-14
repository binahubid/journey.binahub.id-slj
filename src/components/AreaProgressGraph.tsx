"use client";

import { useId } from "react";

interface ChartRow {
  day: string;
  avg: number | null;
}

export default function AreaProgressGraph({ data, className = "" }: { data: ChartRow[]; className?: string }) {
  const gradientId = useId();
  const measured = data.filter((row): row is ChartRow & { avg: number } => row.avg !== null && Number.isFinite(row.avg));
  if (measured.length === 0) {
    return (
      <div className={`flex items-center justify-center h-16 ${className}`}>
        <span className="text-xs text-white/80">Belum ada jadwal kebiasaan</span>
      </div>
    );
  }

  const scaleMin = 0;
  const scaleRange = 100;

  const svgW = 240;
  const svgH = 64;
  const ptLeft = 4;
  const ptRight = svgW - 4;
  const ptTop = 4;
  const ptBot = svgH - 4;
  const ptW = ptRight - ptLeft;
  const ptH = ptBot - ptTop;

  const toX = (i: number) => measured.length === 1 ? ptLeft + ptW / 2 : ptLeft + (i / (measured.length - 1)) * ptW;
  const toY = (v: number) => ptTop + ptH - ((v - scaleMin) / scaleRange) * ptH;

  const linePath = measured.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(d.avg).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${toX(measured.length - 1).toFixed(1)} ${ptBot} L ${toX(0).toFixed(1)} ${ptBot} Z`;

  const lastVal = measured[measured.length - 1].avg;
  const lastX = toX(measured.length - 1);
  const lastY = toY(lastVal);

  return (
    <div className={`relative ${className}`}>
      <svg role="img" aria-label={`Konsistensi pelaksanaan kebiasaan sesuai jadwal, terakhir ${Math.round(lastVal)} persen. Skala 0 sampai 100 persen.`} viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id={`${gradientId}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#FDE68A" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId}-area)`} />
        <path d={linePath} fill="none" stroke={`url(#${gradientId}-line)`} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastX} cy={lastY} r={3} fill="#FBBF24" stroke="white" strokeWidth={1} />
      </svg>
    </div>
  );
}
