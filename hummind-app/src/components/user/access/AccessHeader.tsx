import { Input } from "../../ui/input";

interface AccessHeaderProps {
  title: string;
  subtitle: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
}

export function AccessHeader({
  title,
  subtitle,
  searchPlaceholder = "Rechercher…",
  onSearchChange,
}: AccessHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle max-w-2xl">{subtitle}</p>
      </div>

      <div className="w-full max-w-md">
        <Input
          className="h-10 rounded-full bg-secondary text-sm placeholder:text-muted-foreground"
          placeholder={searchPlaceholder}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>
    </header>
  );
}
