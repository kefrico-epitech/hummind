"use client";

export function SettingsTabsHeader({
  active,
  setActive,
}: {
  active: string;
  setActive: (value: string) => void;
}) {
  const tabs = [
    { value: "security", label: "Securite du compte" },
    { value: "notifications", label: "Parametres de notifications" },
    { value: "archives", label: "Archives" },
  ];

  return (
    <div className="w-full overflow-x-auto border-b border-white/10">
      <div className="flex min-w-max gap-4 sm:gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActive(tab.value)}
            className={[
              "relative shrink-0 px-0 py-3 text-sm text-white/70 hover:text-white",
              active === tab.value ? "text-primary after:bg-primary" : "after:bg-transparent",
              "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
      </div>
    </div>
  );
}
