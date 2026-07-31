"use client";

import React from "react";

export function MotivationDeclineChart() {
  return (
    <div className="w-full flex flex-col justify-between space-y-6 h-full min-h-[340px] py-2">
      {/* Inline Header / Title */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C79A3C]/20 pb-3">
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#0F1E3D]">
          Grafik Penurunan Semangat (Hari 1 &ndash; 90)
        </span>
        <span className="text-[10px] font-bold text-[#C79A3C] bg-[#C79A3C]/10 border border-[#C79A3C]/30 px-2.5 py-0.5 rounded-full tracking-tight">
          Skenario Ilustratif Tanpa Pendampingan
        </span>
      </div>

      {/* Inline Vector Illustration Chart with Pixel-Perfect SVG Alignment */}
      <div className="flex-grow flex flex-col justify-between space-y-2">
        <div className="relative w-full h-64 sm:h-72 lg:h-80">
          <svg
            viewBox="0 0 500 270"
            className="w-full h-full overflow-visible"
          >
            {/* Subtle Horizontal Grid Lines */}
            <line x1="25" y1="40" x2="475" y2="40" stroke="#C79A3C" strokeOpacity="0.2" strokeDasharray="4 4" strokeWidth="1" />
            <line x1="25" y1="100" x2="475" y2="100" stroke="#C79A3C" strokeOpacity="0.2" strokeDasharray="4 4" strokeWidth="1" />
            <line x1="25" y1="160" x2="475" y2="160" stroke="#C79A3C" strokeOpacity="0.2" strokeDasharray="4 4" strokeWidth="1" />

            {/* Area Fill under Curve */}
            <path
              d="M 25 45 C 100 60, 150 130, 175 140 C 245 170, 300 190, 325 198 C 385 204, 445 208, 475 210 L 475 215 L 25 215 Z"
              fill="#C79A3C"
              fillOpacity="0.09"
            />

            {/* Main Curve Line */}
            <path
              d="M 25 45 C 100 60, 150 130, 175 140 C 245 170, 300 190, 325 198 C 385 204, 445 208, 475 210"
              fill="none"
              stroke="#0F1E3D"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* X Axis Baseline */}
            <line x1="25" y1="215" x2="475" y2="215" stroke="#0F1E3D" strokeOpacity="0.25" strokeWidth="1.5" />

            {/* Checkpoint Dots & Labels */}
            {/* Day 1 (x = 25) */}
            <g>
              <circle cx="25" cy="45" r="5" fill="#0F1E3D" />
              <text x="25" y="235" textAnchor="start" fill="#0F1E3D" fontSize="11" fontWeight="bold">
                Hari 1
              </text>
              <text x="25" y="249" textAnchor="start" fill="#C79A3C" fontSize="10" fontWeight="600">
                Pulang Umrah
              </text>
            </g>

            {/* Day 30 (x = 175) */}
            <g>
              <circle cx="175" cy="140" r="5" fill="#0F1E3D" />
              <text x="175" y="235" textAnchor="middle" fill="#0F1E3D" fontSize="11" fontWeight="bold">
                Hari 30
              </text>
              <text x="175" y="249" textAnchor="middle" fill="#6B7280" fontSize="10" fontWeight="normal">
                Bulan 1
              </text>
            </g>

            {/* Day 60 (x = 325) */}
            <g>
              <circle cx="325" cy="198" r="5" fill="#6B7280" />
              <text x="325" y="235" textAnchor="middle" fill="#0F1E3D" fontSize="11" fontWeight="bold">
                Hari 60
              </text>
              <text x="325" y="249" textAnchor="middle" fill="#6B7280" fontSize="10" fontWeight="normal">
                Bulan 2
              </text>
            </g>

            {/* Day 90 (x = 475) */}
            <g>
              <circle cx="475" cy="210" r="5" fill="#B91C1C" />
              <text x="475" y="235" textAnchor="end" fill="#B91C1C" fontSize="11" fontWeight="bold">
                Hari 90
              </text>
              <text x="475" y="249" textAnchor="end" fill="#B91C1C" fontSize="10" fontWeight="600">
                Bulan 3
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Caption & Keterangan di bawah grafik */}
      <div className="pt-3 text-center border-t border-[#C79A3C]/20 space-y-1.5">
        <p className="text-xs sm:text-sm font-semibold italic text-slate-700">
          &ldquo;Tanpa sistem, semangat perlahan menurun.&rdquo;
        </p>
        <p className="text-[10px] text-slate-400 font-normal leading-relaxed max-w-lg mx-auto">
          * Grafik ini adalah ilustrasi pola perubahan motivasi tanpa pendampingan terstruktur.
        </p>
      </div>
    </div>
  );
}
