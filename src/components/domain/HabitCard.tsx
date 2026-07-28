import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Flame, Clock } from "lucide-react";

interface HabitCardProps {
  id: string;
  title: string;
  category: string;
  reminderTime?: string;
  streakCount?: number;
  completedToday?: boolean;
  weeklyLogs?: boolean[]; // 7 days boolean array
  onToggleToday?: (completed: boolean) => void;
}

export function HabitCard({
  title,
  category,
  reminderTime = "05:00",
  streakCount = 0,
  completedToday = false,
  weeklyLogs = [true, true, false, true, true, false, false],
  onToggleToday,
}: HabitCardProps) {
  const [isChecked, setIsChecked] = useState(completedToday);

  const handleCheck = (checked: boolean) => {
    setIsChecked(checked);
    onToggleToday?.(checked);
  };

  const days = ["S", "S", "R", "K", "J", "S", "M"];

  return (
    <Card className="p-4 space-y-3 bg-white border-warm-border hover:border-navy-900/30 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Checkbox
            checked={isChecked}
            onCheckedChange={handleCheck}
            className="mt-0.5"
          />
          <div>
            <h4 className={`text-sm font-semibold transition-all ${isChecked ? "line-through text-gray-400" : "text-navy-900"}`}>
              {title}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                {category}
              </Badge>
              {reminderTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-400" /> {reminderTime}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Streak Counter */}
        <div className="flex items-center space-x-1 text-accent bg-accent-light px-2 py-0.5 rounded-full text-xs font-semibold">
          <Flame className="h-3.5 w-3.5 fill-accent" />
          <span>{streakCount} hari</span>
        </div>
      </div>

      {/* 7-Day Grid */}
      <div className="pt-2 border-t border-warm-border flex items-center justify-between">
        <span className="text-[11px] text-gray-400 font-medium">Progres Minggu Ini</span>
        <div className="flex items-center space-x-1.5">
          {days.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`h-4 w-4 rounded-sm flex items-center justify-center text-[9px] font-bold ${
                  weeklyLogs[i]
                    ? "bg-[#2F855A] text-white"
                    : i === weeklyLogs.length - 1 && isChecked
                    ? "bg-[#2F855A] text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {weeklyLogs[i] ? "✓" : ""}
              </div>
              <span className="text-[9px] text-gray-400">{day}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
