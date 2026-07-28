import { Card } from "@/components/ui/card";
import { MessageSquare, UserCheck } from "lucide-react";

interface CoachCardProps {
  coachName?: string;
  lastNote?: string;
  lastNoteDate?: string;
}

export function CoachCard({
  coachName = "Ustadz Budi Rahman",
  lastNote = "MasyaAllah progres Tahajud dan Tilawah minggu ini sangat konsisten. Tetap jaga niat awal ya Mas Ahmad.",
  lastNoteDate = "Kemarin, 20:15",
}: CoachCardProps) {
  return (
    <Card className="bg-white border-warm-border p-5 space-y-3">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-navy-900 text-accent font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
          <UserCheck className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-navy-900">{coachName}</h4>
          <p className="text-xs text-gray-500">Personal Coach Pendamping</p>
        </div>
      </div>

      {lastNote ? (
        <div className="bg-warm-bg p-3.5 rounded-md border border-warm-border space-y-1">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span className="font-semibold text-navy-900 flex items-center gap-1">
              <MessageSquare className="h-3 w-3 text-accent" /> Catatan Terbaru Coach
            </span>
            <span>{lastNoteDate}</span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed italic">
            &ldquo;{lastNote}&rdquo;
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">Belum ada catatan dari coach minggu ini.</p>
      )}
    </Card>
  );
}
