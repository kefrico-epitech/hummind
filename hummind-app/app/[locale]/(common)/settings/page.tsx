"use client";

import { useState } from "react";
import { ArchivesTab } from "../../../../src/components/settings/ArchivesTab";
import { NotificationsTab } from "../../../../src/components/settings/NotificationsTab";
import { SecurityTab } from "../../../../src/components/settings/SecurityTab";
import { SettingsTabsHeader } from "../../../../src/components/settings/SettingsTabsHeader";
import { UnarchiveOrgDialog } from "../../../../src/components/settings/UnarchiveOrgDialog";
import { useOrgSettings } from "../../../../src/hooks/useOrgSettings";
import { useAccountSecurity } from "../../../../src/hooks/useAccountSecurity"; 

export default function OrganisationSettingsPage() {
  // ⚡ Partie sécurité branchée sur Redux via useAccountSecurity
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

  // ⚡ Partie notifications + archives reste gérée par ton hook global
  const {
    initial,
    notifications,
    setNotifications,
    saveNotifications,
    saving,
    dirty,
    savedPulse,
    selectedOrg,
    setSelectedOrg,
    unarchiving,
    confirmUnarchive,
  } = useOrgSettings();

  const [active, setActive] = useState("security");

  return (
    <div className="w-full">
      <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-5 md:py-6">
        {/* Header des onglets */}
        <SettingsTabsHeader active={active} setActive={setActive} />

        {/* Contenu des onglets */}
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

        {active === "archives" && (
          <div className="mt-6">
            <ArchivesTab
              organisations={initial.archives.organisations}
              onUnarchive={(org) => setSelectedOrg(org)}
            />
          </div>
        )}
      </div>

      {/* Dialog */}
      <UnarchiveOrgDialog
        org={selectedOrg}
        open={!!selectedOrg}
        onOpenChange={(v) => !v && setSelectedOrg(null)}
        loading={unarchiving}
        onConfirm={confirmUnarchive}
      />
    </div>
  );
}
