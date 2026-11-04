import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Button — Premium button component with variants and sizes.
 * Supports gradient, glass, ghost, and outline styles.
 */
const buttonVariants = {
  default: "bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg active:scale-[0.98]",
  gradient: "bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 text-white shadow-lg hover:shadow-xl hover:brightness-110 active:scale-[0.98]",
  glass: "glass text-[var(--text-primary)] hover:bg-white/20 dark:hover:bg-white/10",
  outline: "border border-primary-500/30 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20",
  ghost: "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]",
  danger: "bg-error-500 text-white hover:bg-red-600 shadow-md",
  success: "bg-success-500 text-white hover:bg-emerald-600 shadow-md",
};

const buttonSizes = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-5 text-sm rounded-xl gap-2",
  lg: "h-12 px-8 text-base rounded-xl gap-2.5",
  xl: "h-14 px-10 text-lg rounded-2xl gap-3",
  icon: "h-10 w-10 rounded-xl",
};

const Button = forwardRef(
  ({ className, variant = "default", size = "md", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "relative inline-flex items-center justify-center font-semibold",
          "transition-all duration-200 ease-out",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          "cursor-pointer select-none",
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
