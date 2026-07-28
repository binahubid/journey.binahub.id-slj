import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => (
    <label
      className={cn(
        "inline-flex items-center justify-center h-6 w-6 rounded-md border-2 border-gray-300 bg-white transition-all cursor-pointer select-none",
        checked && "bg-accent border-accent text-navy-900 animate-spring-pop",
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
      {checked && <Check className="h-4 w-4 stroke-[3]" />}
    </label>
  )
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
