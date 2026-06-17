"use client";

import { useState } from "react";
import { NotificationsTab } from "../../../../src/components/settings/NotificationsTab";
import { SecurityTab } from "../../../../src/components/settings/SecurityTab";
import { useAccountSecurity } from "../../../../src/hooks/useAccountSecurity";
import { useOrgSettings } from "../../../../src/hooks/useOrgSettings";

const tabs = [
  { value: "security", label: "Sécurité du compte" },
  { value: "notifications", label: "Paramètres de notifications" },
];

export default function LearnerSettingsPage() {
  const {
    form: securityForm,
    setForm: setSecurityForm,
    dirty: securityDirty,
    reset: resetSecurity,
    save: saveSecurity,
    saving: savingSecurity,
    savedPulse: savedPulseSecurity,
    error: securityError,
    setPasswordHash,
  } = useAccountSecurity();

  const {
    initial,
    notifications,
    setNotifications,
    saveNotifications,
    saving,
    dirty,
    savedPulse,
  } = useOrgSettings();

  const [active, setActive] = useState("security");

  return (
    <div className="w-full">
      <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-5 md:py-6">
        {/* Tabs header */}
        <div className="w-full overflow-x-auto border-b border-white/10">
          <div className="flex min-w-max gap-4 sm:gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActive(tab.value)}
                className={[
                  "relative shrink-0 px-0 py-3 text-sm text-white/70 hover:text-white",
                  active === tab.value
                    ? "text-primary after:bg-primary"
                    : "after:bg-transparent",
                  "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
            <div className="flex-1" />
          </div>
        </div>

        {/* Security tab */}
        {active === "security" && (
          <div className="mt-6">
            <SecurityTab
              value={securityForm}
              onChange={setSecurityForm}
              dirty={securityDirty}
              saving={savingSecurity}
              savedPulse={savedPulseSecurity}
              error={securityError}
              onReset={resetSecurity}
              onSave={saveSecurity}
              onPasswordChange={setPasswordHash}
            />
          </div>
        )}

        {/* Notifications tab */}
        {active === "notifications" && (
          <div className="mt-6">
            <NotificationsTab
              value={notifications}
              onChange={setNotifications}
              onSave={saveNotifications}
              saving={saving.notifications}
              dirty={dirty.notifications}
              savedPulse={savedPulse.notifications}
              onReset={() => setNotifications(initial.notifications)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
