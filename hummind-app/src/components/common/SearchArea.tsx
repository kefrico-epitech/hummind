import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SearchAreaProps {
  value: string;
  onSearch: (val: string) => void;
}

export default function SearchArea({ value, onSearch }: SearchAreaProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="ml-8 flex items-center gap-2 border-b border-muted-foreground/40 px-1"
    >
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-label="Ouvrir la recherche"
        className="p-1"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
      </button>

      <div
        className={`flex items-center transition-all duration-200 ease-out overflow-hidden ${
          open ? "w-40 opacity-100" : "w-0 opacity-0"
        }`}
      >
        <input
          autoFocus={open}
          onBlur={() => setOpen(false)}
          type="text"
          placeholder="Recherche"
          value={value}
          onChange={(e) => onSearch(e.target.value)} // ✅ remonte la valeur
          className="h-8 bg-transparent text-sm outline-none placeholder:text-muted-foreground w-full"
        />
      </div>

      {open && (
        <button
          type="button"
          onClick={() => {
            onSearch(""); // ✅ reset la recherche
            setOpen(false);
          }}
          aria-label="Fermer la recherche"
          className="p-1"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
