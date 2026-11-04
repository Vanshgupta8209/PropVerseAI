import { cn } from "@/lib/utils";

/**
 * Card — Glassmorphic card component with hover effects.
 */
function Card({ className, children, hover = true, glass = false, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden",
        "transition-all duration-300 ease-out",
        glass
          ? "glass"
          : "bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-[var(--shadow-sm)]",
        hover && "hover:shadow-[var(--shadow-lg)] hover:-translate-y-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn("px-6 pt-6 pb-2", className)} {...props}>
      {children}
    </div>
  );
}

function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("px-6 py-4", className)} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-[var(--border-secondary)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card, CardHeader, CardContent, CardFooter };
