import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent",
  {
    variants: {
      variant: {
        default: "bg-navy-900 text-white",
        success: "bg-emerald-100 text-status-success border border-emerald-200 font-semibold",
        warning: "bg-amber-100 text-status-warning border border-amber-200 font-semibold",
        danger: "bg-red-100 text-status-danger border border-red-200 font-semibold",
        accent: "bg-accent-light text-navy-900 border border-accent/30 font-semibold",
        secondary: "bg-gray-100 text-gray-700 border border-gray-200",
        outline: "text-navy-900 border border-warm-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
