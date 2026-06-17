import { cn } from "../../lib/utils";

interface CountBadgeProps {
  count?: number | null;
  className?: string;
}

export function CountBadge({ count, className }: CountBadgeProps) {
  if (typeof count !== "number" || count <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white shadow-sm ring-2 ring-background tabular-nums",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default CountBadge;
