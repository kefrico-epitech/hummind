import * as React from "react";

export function Field({
  label,
  hint,
  labelClassName,
  hintClassName,
  children,
}: {
  label: string;
  hint?: string;
  labelClassName?: string;
  hintClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className={`text-sm font-medium ${labelClassName ?? "text-white/60"}`}>
        {label}
      </div>
      {children}
      {hint ? (
        <div className={`text-xs ${hintClassName ?? "text-muted-foreground"}`}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}
