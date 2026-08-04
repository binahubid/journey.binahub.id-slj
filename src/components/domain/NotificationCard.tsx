import { Bell, Calendar, MessageSquare, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
  title: string;
  message: string;
  category?: "reminder" | "checkpoint" | "coach" | "system" | "welcome" | "onboarding";
  isRead?: boolean;
  createdAt: string;
  onMarkRead?: () => void;
}

export function NotificationCard({
  title,
  message,
  category = "reminder",
  isRead = false,
  createdAt,
  onMarkRead,
}: NotificationCardProps) {
  const getIcon = () => {
    switch (category) {
      case "checkpoint":
        return <Calendar className="h-4 w-4 text-accent" />;
      case "coach":
        return <MessageSquare className="h-4 w-4 text-navy-900" />;
      case "system":
        return <AlertCircle className="h-4 w-4 text-status-warning" />;
      default:
        return <Bell className="h-4 w-4 text-navy-900" />;
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onMarkRead?.(); }}
      className={cn(
        "p-4 flex items-start space-x-3 transition-all cursor-pointer border-slate-200/80 hover:border-amber-300 hover:shadow-sm",
        !isRead ? "bg-amber-50/50 border-amber-200" : "bg-white"
      )}
    >
      <div className="p-2 rounded-full bg-warm-bg border border-warm-border flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-grow space-y-1 min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <h4 className="text-sm font-semibold text-navy-900 truncate">{title}</h4>
          <span className="text-[11px] text-gray-400 shrink-0">{createdAt}</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">{message}</p>
      </div>
      {!isRead && (
        <span className="h-2 w-2 rounded-full bg-accent flex-shrink-0 mt-2" />
      )}
    </Card>
  );
}
