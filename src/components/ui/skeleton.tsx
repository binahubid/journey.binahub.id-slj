import { cn } from "@/lib/utils";

/**
 * Skeleton Loading Component (emilkowal.ski/skill pattern)
 * Dedicated calm shimmer loading state for cards, lists, and widgets.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md bg-slate-200/70 motion-safe:animate-pulse", className)}
      {...props}
    />
  );
}

export { Skeleton };
