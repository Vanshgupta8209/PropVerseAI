import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Logo({ size = "md", showSubtitle = true, showBadge = true, className = "" }) {
  const sizes = {
    sm: {
      box: "w-8 h-8 rounded-lg",
      icon: 18,
      propText: "text-lg",
      verseText: "text-lg",
      badge: "text-[9px] px-1 py-0.2",
      sub: "text-[8px]",
    },
    md: {
      box: "w-9.5 h-9.5 rounded-xl",
      icon: 20,
      propText: "text-xl",
      verseText: "text-xl",
      badge: "text-[10px] px-1.5 py-0.5",
      sub: "text-[9px]",
    },
    lg: {
      box: "w-11 h-11 rounded-2xl",
      icon: 24,
      propText: "text-2xl",
      verseText: "text-2xl",
      badge: "text-xs px-2 py-0.5",
      sub: "text-[10px]",
    },
  };

  const s = sizes[size] || sizes.md;

  return (
    <Link to="/" className={cn("inline-flex items-center gap-2.5 group select-none cursor-pointer", className)}>
      {/* Icon Box */}
      <div className="relative">
        <div
          className={cn(
            "bg-gradient-to-tr from-primary-600 via-primary-500 to-accent-500 flex items-center justify-center text-white shadow-md shadow-primary-500/30 group-hover:shadow-lg group-hover:shadow-primary-500/50 group-hover:scale-105 transition-all duration-300",
            s.box
          )}
        >
          <Building2 size={s.icon} className="text-white drop-shadow" />
        </div>
        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent-400 rounded-full ring-2 ring-[var(--bg-surface)] animate-pulse" />
      </div>

      {/* Brand Text */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center">
          {/* High-visibility "Prop" with distinct primary color contrast */}
          <span className={cn("font-black tracking-tight text-primary-600 dark:text-primary-400 drop-shadow-[0_1px_1px_rgba(79,70,229,0.2)]", s.propText)}>
            Prop
          </span>
          {/* Vibrant "Verse" gradient text */}
          <span className={cn("font-black tracking-tight gradient-text ml-0.5", s.verseText)}>
            Verse
          </span>
          {/* AI Badge */}
          {showBadge && (
            <span
              className={cn(
                "ml-1.5 font-extrabold uppercase tracking-wider text-accent-600 dark:text-accent-300 bg-accent-50 dark:bg-accent-950/60 border border-accent-300/60 dark:border-accent-700/60 rounded-md shadow-2xs",
                s.badge
              )}
            >
              AI
            </span>
          )}
        </div>
        {showSubtitle && (
          <span className={cn("font-medium text-[var(--text-tertiary)] tracking-widest uppercase mt-0.5", s.sub)}>
            Smart Real Estate
          </span>
        )}
      </div>
    </Link>
  );
}
