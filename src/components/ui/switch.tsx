import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * Uiverse-inspired micro-interactive Switch component
 * Mapped to SLJ Design System: Navy (#0F1E3D) active, Accent (#C79A3C) indicator, Warm Border
 */
const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => (
    <label
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out select-none",
        checked ? "bg-navy-900" : "bg-gray-200",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="sr-only"
        {...props}
      />
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5 bg-accent" : "translate-x-0"
        )}
      />
    </label>
  )
);
Switch.displayName = "Switch";

export { Switch };
