interface TimelineProps {
  activeStage?: number; // 1 to 4
}

export function Timeline({ activeStage = 2 }: TimelineProps) {
  const stages = [
    { num: 1, name: "Muhasabah", desc: "Refleksi Baseline" },
    { num: 2, name: "Niyyah", desc: "Transformation Blueprint" },
    { num: 3, name: "Mujahadah", desc: "Spiritual Experience" },
    { num: 4, name: "Istiqamah", desc: "Sustainable Habit" },
  ];

  return (
    <div className="w-full py-4">
      <div className="grid grid-cols-4 gap-2 relative">
        {/* Connecting Line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 -z-0" />
        <div
          className="absolute top-4 left-6 h-0.5 bg-navy-900 transition-all duration-500 -z-0"
          style={{ width: `${((activeStage - 1) / 3) * 100}%` }}
        />

        {stages.map((stg) => {
          const isActive = stg.num <= activeStage;
          const isCurrent = stg.num === activeStage;

          return (
            <div key={stg.num} className="flex flex-col items-center text-center z-10 space-y-1.5">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCurrent
                    ? "bg-accent text-navy-900 ring-4 ring-amber-100 scale-110 shadow-sm"
                    : isActive
                    ? "bg-navy-900 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {stg.num}
              </div>
              <div>
                <p className={`text-xs font-bold ${isActive ? "text-navy-900" : "text-gray-400"}`}>
                  {stg.name}
                </p>
                <p className="text-[10px] text-gray-400 hidden sm:block">{stg.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
