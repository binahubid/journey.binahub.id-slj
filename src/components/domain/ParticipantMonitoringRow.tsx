import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { JourneyStatus } from "@/types/slj";

interface ParticipantMonitoringRowProps {
  id: string;
  fullName: string;
  dayCount: number;
  journeyStatus: JourneyStatus;
  habitCompletionPercent: number; // 0-100
  lastCheckpointStatus?: "ON_TRACK" | "NEED_SUPPORT" | "NOT_FILLED";
  lastActiveAt: string;
  flag?: {
    type: string;
    label: string;
  };
  onClick?: () => void;
}

export function ParticipantMonitoringRow({
  fullName,
  dayCount,
  journeyStatus,
  habitCompletionPercent,
  lastCheckpointStatus = "NOT_FILLED",
  lastActiveAt,
  flag,
  onClick,
}: ParticipantMonitoringRowProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-md border bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-all ${
        flag ? "border-amber-300 bg-amber-50/30" : "border-warm-border"
      }`}
    >
      {/* Participant Info */}
      <div className="flex min-w-0 items-center space-x-3 md:min-w-[200px]">
        <div className="h-10 w-10 rounded-full bg-navy-900 text-accent font-semibold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
          {fullName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h4 className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm font-bold text-navy-900">
            <span className="break-words">{fullName}</span>
            {flag && (
              <Badge variant="warning" className="text-[10px] py-0 px-1.5 gap-1 font-medium">
                <AlertTriangle className="h-3 w-3" /> {flag.label}
              </Badge>
            )}
          </h4>
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <span>Hari ke-{dayCount} dari 90</span>
            <span>•</span>
            <span className="capitalize">{journeyStatus.toLowerCase()}</span>
          </p>
        </div>
      </div>

      {/* Habit Completion Sparkline */}
      <div className="w-full md:w-44 space-y-1">
        <div className="flex justify-between text-xs font-medium text-navy-900">
          <span>Habit (7 hr)</span>
          <span className="font-semibold">{habitCompletionPercent}%</span>
        </div>
        <Progress value={habitCompletionPercent} className="h-2" />
      </div>

      {/* Checkpoint Status */}
      <div className="flex items-center space-x-2 md:min-w-[140px]">
        <span className="text-xs text-gray-500 hidden md:inline">Checkpoint:</span>
        {lastCheckpointStatus === "ON_TRACK" ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> On Track
          </Badge>
        ) : lastCheckpointStatus === "NEED_SUPPORT" ? (
          <Badge variant="warning" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> Need Support
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" /> Belum Diisi
          </Badge>
        )}
      </div>

      {/* Last Active */}
      <div className="text-right text-xs text-gray-400 min-w-[100px] hidden md:block">
        Aktif {lastActiveAt}
      </div>
    </div>
  );
}
