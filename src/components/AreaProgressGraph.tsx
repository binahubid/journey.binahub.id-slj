"use client";

interface ChartRow {
  day: string;
  avg: number;
}

export default function AreaProgressGraph({ data, className = "" }: { data: ChartRow[]; className?: string }) {
  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-16 ${className}`}>
        <span className="text-[10px] text-white/40 font-medium">Belum ada data area</span>
      </div>
    );
  }

  const values = data.map(d => d.avg);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(0, ...values);
  const range = maxVal - minVal || 1;
  const pad = Math.max(1, range * 0.15);
  const scaleMin = minVal - pad;
  const scaleMax = maxVal + pad;
  const scaleRange = scaleMax - scaleMin;

  const svgW = 240;
  const svgH = 64;
  const ptLeft = 4;
  const ptRight = svgW - 4;
  const ptTop = 4;
  const ptBot = svgH - 4;
  const ptW = ptRight - ptLeft;
  const ptH = ptBot - ptTop;

  const toX = (i: number) => data.length === 1 ? ptLeft + ptW / 2 : ptLeft + (i / (data.length - 1)) * ptW;
  const toY = (v: number) => ptTop + ptH - ((v - scaleMin) / scaleRange) * ptH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(d.avg).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${toX(data.length - 1).toFixed(1)} ${ptBot} L ${toX(0).toFixed(1)} ${ptBot} Z`;

  const lastVal = data[data.length - 1].avg;
  const lastX = toX(data.length - 1);
  const lastY = toY(lastVal);

  return (
    <div className={`relative ${className}`}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradHero" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="lineGradHero" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#FDE68A" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGradHero)" />
        <path d={linePath} fill="none" stroke="url(#lineGradHero)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastX} cy={lastY} r={3} fill="#FBBF24" stroke="white" strokeWidth={1} />
      </svg>
    </div>
  );
}
