// ui/select.tsx
import React from "react";

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
};

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
}: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-11 w-full rounded-2xl border-[#3a3a3a] bg-transparent text-white placeholder:text-[#777] focus-visible:border-[#7C6BF5] ${className}`}
    >
      {placeholder && (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-[#1a1a1a] text-white">
          {opt}
        </option>
      ))}
    </select>
  );
}
