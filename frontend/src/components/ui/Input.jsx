import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Input — Styled form input with label, error, and icon support.
 */
const Input = forwardRef(
  ({ className, label, error, icon: Icon, type = "text", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
              <Icon size={18} />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              "w-full h-11 rounded-xl",
              "bg-[var(--bg-surface)] border border-[var(--border-primary)]",
              "text-[var(--text-primary)] text-sm",
              "placeholder:text-[var(--text-tertiary)]",
              "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              Icon ? "pl-10 pr-4" : "px-4",
              error && "border-error-500 focus:ring-error-500/30",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-error-500 mt-1">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
