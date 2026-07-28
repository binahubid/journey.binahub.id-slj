import { cn } from "@/lib/utils";

/**
 * Skeleton Loading Component (emilkowal.ski/skill pattern)
 * Dedicated calm shimmer loading state for cards, lists, and widgets.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-warm-border/60", className)}
      {...props}
    />
  );
}

export { Skeleton };
