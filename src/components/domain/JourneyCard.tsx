import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { JourneyStatus } from "@/types/slj";
import { Calendar, Compass } from "lucide-react";

interface JourneyCardProps {
  currentDay?: number;
  totalDays?: number;
  status?: JourneyStatus;
  mainTarget?: string;
}

export function JourneyCard({
  currentDay = 42,
  totalDays = 90,
  status = JourneyStatus.ACTIVE,
  mainTarget = "Menjaga Sholat Tahajud 5x seminggu & Menjadi Pemimpin yang Lebih Sabar",
}: JourneyCardProps) {
  const percent = Math.min(100, Math.round((currentDay / totalDays) * 100));

  return (
    <Card className="bg-navy-900 text-white border-navy-800 p-6 space-y-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Compass className="h-5 w-5 text-accent" />
          <h3 className="text-base font-semibold text-white tracking-tight">Status Perjalanan</h3>
        </div>
        <Badge variant="accent" className="font-semibold uppercase tracking-wider text-[11px]">
          {status}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Hari ke-{currentDay} <span className="text-sm font-normal text-gray-300">dari {totalDays} Hari</span>
          </h2>
          <span className="text-sm font-semibold text-accent">{percent}% Selesai</span>
        </div>
        <Progress value={percent} className="h-2 bg-navy-800" indicatorClassName="bg-accent" />
      </div>

      {mainTarget && (
        <div className="pt-2 border-t border-navy-800 text-xs text-gray-300 space-y-1">
          <span className="text-accent font-medium block">Target Utama 90 Hari:</span>
          <p className="leading-relaxed font-normal text-gray-200">{mainTarget}</p>
        </div>
      )}
    </Card>
  );
}
