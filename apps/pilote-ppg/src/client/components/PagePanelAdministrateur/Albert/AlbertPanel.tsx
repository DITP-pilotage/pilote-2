import { useRouter } from "next/router";
import { ComponentType, useMemo } from "react";
import { Tabs } from "@/components/shared/Tabs";
import { AlbertChat } from "@/components/PagePanelAdministrateur/Albert/AlbertChat";
import { AlbertDashboard } from "@/components/PagePanelAdministrateur/Albert/AlbertDashboard";
import { AlbertProfilPermissions } from "@/components/PagePanelAdministrateur/Albert/AlbertProfilPermissions";
import { AlbertUtilisateurPermissions } from "@/components/PagePanelAdministrateur/Albert/AlbertUtilisateurPermissions";

type Onglet =
  "discussion" | "dashboard" | "permissions-profils" | "permissions-emails";

const ITEMS: { value: Onglet; label: string }[] = [
  { value: "discussion", label: "Discussion" },
  { value: "dashboard", label: "Dashboard" },
  { value: "permissions-profils", label: "Permissions profils" },
  { value: "permissions-emails", label: "Permissions emails" },
];

const isOnglet = (value: string): value is Onglet =>
  ITEMS.some((item) => item.value === value);

const CONTENU: Record<Onglet, ComponentType> = {
  discussion: AlbertChat,
  dashboard: AlbertDashboard,
  "permissions-profils": AlbertProfilPermissions,
  "permissions-emails": AlbertUtilisateurPermissions,
};

export const AlbertPanel = () => {
  const router = useRouter();

  const ongletActif: Onglet = useMemo(() => {
    const queryParam = router.query.onglet;
    const valeur = Array.isArray(queryParam) ? queryParam[0] : queryParam;
    return valeur && isOnglet(valeur) ? valeur : "discussion";
  }, [router.query.onglet]);

  const changerOnglet = (valeur: string) => {
    if (!isOnglet(valeur)) return;
    router.replace(
      { pathname: router.pathname, query: { onglet: valeur } },
      undefined,
      { shallow: true },
    );
  };

  const Contenu = CONTENU[ongletActif];

  return (
    <div>
      <Tabs items={ITEMS} onValueChange={changerOnglet} value={ongletActif} />
      <div className="mt-6">
        <Contenu />
      </div>
    </div>
  );
};
