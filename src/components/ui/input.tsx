import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-navy-900">
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            "flex h-11 w-full rounded-lg border border-warm-border bg-white px-3 py-2 text-base sm:text-sm text-navy-900 placeholder:text-gray-400 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900 disabled:cursor-not-allowed disabled:opacity-40 transition-colors",
            error && "border-status-danger focus:ring-status-danger",
            className
          )}
          ref={ref}
          {...props}
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={[props["aria-describedby"], error ? `${inputId}-error` : null].filter(Boolean).join(" ") || undefined}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-status-danger">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
