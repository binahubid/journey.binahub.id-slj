import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-navy-900">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            "flex min-h-[100px] w-full rounded-md border border-warm-border bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-gray-400 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900 disabled:cursor-not-allowed disabled:opacity-40 transition-colors resize-y",
            error && "border-status-danger focus:ring-status-danger",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs text-status-danger">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
