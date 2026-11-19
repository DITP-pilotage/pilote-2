import { PanelTabs } from "@/components/PagePanelAdministrateur/PanelTabs";
import { AlbertChat } from "@/components/PagePanelAdministrateur/Albert/AlbertChat";
import { AlbertDashboard } from "@/components/PagePanelAdministrateur/Albert/AlbertDashboard";
import { AlbertProfilPermissions } from "@/components/PagePanelAdministrateur/Albert/AlbertProfilPermissions";
import { AlbertUtilisateurPermissions } from "@/components/PagePanelAdministrateur/Albert/AlbertUtilisateurPermissions";

export const AlbertPanel = () => (
  <PanelTabs
    tabs={[
      { value: "discussion", label: "Discussion", content: AlbertChat },
      { value: "dashboard", label: "Dashboard", content: AlbertDashboard },
      {
        value: "permissions-profils",
        label: "Permissions profils",
        content: AlbertProfilPermissions,
      },
      {
        value: "permissions-emails",
        label: "Permissions emails",
        content: AlbertUtilisateurPermissions,
      },
    ]}
  />
);
