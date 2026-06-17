import { CountBadge } from "../../ui/count-badge";

export interface AccessTab {
  value: "organisation" | "departement" | "salle" | "independant";
  label: string;
  badgeCount?: number;
}

interface AccessTabsNavProps {
  tabs: AccessTab[];
  active: AccessTab["value"];
  onChange: (value: AccessTab["value"]) => void;
}

export function AccessTabsNav({ tabs, active, onChange }: AccessTabsNavProps) {
  return (
    <div className="flex border-b border-border">
      {tabs.map((tab, index) => {
        const isActive = active === tab.value;
        const badgeCount =
          typeof tab.badgeCount === "number" && tab.badgeCount > 0
            ? tab.badgeCount
            : null;

        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`relative pb-2 text-sm font-medium transition-colors ${
              index === 0 ? "pl-0 pr-4" : "px-4"
            } ${
              isActive
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <span>{tab.label}</span>
              <CountBadge count={badgeCount} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
