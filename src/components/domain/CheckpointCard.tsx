import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";

interface CheckpointCardProps {
  monthNumber: 1 | 2 | 3;
  status?: "ON_TRACK" | "NEED_SUPPORT" | "NOT_FILLED";
  participantNote?: string;
  coachNote?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function CheckpointCard({
  monthNumber,
  status = "NOT_FILLED",
  participantNote,
  coachNote,
  isSelected,
  onClick,
}: CheckpointCardProps) {
  const monthTitles = {
    1: "Bulan 1",
    2: "Bulan 2",
    3: "Bulan 3",
  };

  const dayRanges = {
    1: "Hari 1–30",
    2: "Hari 31–60",
    3: "Hari 61–90",
  };

  return (
    <Card
      onClick={onClick}
      className={`p-2.5 sm:p-5 aspect-square sm:aspect-auto flex flex-col justify-between cursor-pointer transition-all border ${
        isSelected
          ? "border-navy-900 bg-amber-50/50 ring-2 ring-navy-900 shadow-md"
          : status === "ON_TRACK"
          ? "border-emerald-200 bg-emerald-50/20 hover:border-emerald-300"
          : status === "NEED_SUPPORT"
          ? "border-amber-200 bg-amber-50/20 hover:border-amber-300"
          : "border-warm-border bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex flex-col items-center sm:flex-row sm:justify-between text-center sm:text-left gap-1">
        <div>
          <h4 className="text-sm sm:text-base font-extrabold text-navy-900 leading-tight">
            {monthTitles[monthNumber]}
          </h4>
          <span className="text-[10px] sm:text-xs text-gray-500 font-medium block">
            {dayRanges[monthNumber]}
          </span>
        </div>

        {status === "ON_TRACK" ? (
          <Badge variant="success" className="gap-0.5 sm:gap-1 text-[9px] sm:text-xs px-1.5 py-0.5 mt-1 sm:mt-0">
            <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="hidden sm:inline">On Track</span>
          </Badge>
        ) : status === "NEED_SUPPORT" ? (
          <Badge variant="warning" className="gap-0.5 sm:gap-1 text-[9px] sm:text-xs px-1.5 py-0.5 mt-1 sm:mt-0">
            <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="hidden sm:inline">Support</span>
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-0.5 sm:gap-1 text-[9px] sm:text-xs px-1.5 py-0.5 mt-1 sm:mt-0">
            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="hidden sm:inline">Belum Diisi</span>
          </Badge>
        )}
      </div>

      <div className="hidden sm:block">
        {participantNote ? (
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
            <strong>Refleksi:</strong> &ldquo;{participantNote}&rdquo;
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">
            {status === "NOT_FILLED" ? "Pemeriksaan dibuka saat memasuki bulan ini." : "Belum ada catatan refleksi."}
          </p>
        )}
      </div>

      {coachNote && (
        <div className="hidden sm:block pt-2 border-t border-warm-border text-[11px] text-gray-500">
          <strong className="text-navy-900">Coach:</strong> {coachNote}
        </div>
      )}
    </Card>
  );
}
