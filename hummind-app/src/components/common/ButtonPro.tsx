import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";
import * as React from "react";

interface ButtonProProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingLabel?: string;
}

export const ButtonPro = React.forwardRef<HTMLButtonElement, ButtonProProps>(
  ({ className, loading, loadingLabel, children, disabled, ...props }, ref) => {
    const resolvedLoadingLabel =
      loadingLabel ??
      (typeof children === "string" && children.trim()
        ? children
        : "Chargement...");

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          `
        group relative w-full overflow-hidden rounded-2xl
        bg-linear-to-r from-[#7C6BF5] via-[#6A5DF0] to-[#4C46D6]
        px-6 py-4 text-base font-semibold text-white
        shadow-[0_20px_50px_-20px_rgba(124,107,245,0.9)]
        transition-all duration-300
        hover:-translate-y-0.5 hover:shadow-[0_28px_60px_-22px_rgba(124,107,245,1)]
        active:translate-y-0
        disabled:cursor-not-allowed disabled:opacity-60
        focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50
        `,
          className,
        )}
        {...props}
      >
        {/* Glow top */}
        <span className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/25 via-transparent to-transparent opacity-70" />

        {/* Moving light */}
        <span className="pointer-events-none absolute -left-1/2 top-0 h-full w-1/2 skew-x-[-20deg] bg-white/10 opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100" />

        {/* Content */}
        <span
          className={cn(
            "relative z-10 flex items-center justify-center gap-2",
            loading && "opacity-0",
          )}
        >
          {children}
        </span>

        {loading ? (
          <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-white" />
            <span>{resolvedLoadingLabel}</span>
          </span>
        ) : null}
      </button>
    );
  },
);

ButtonPro.displayName = "ButtonPro";
