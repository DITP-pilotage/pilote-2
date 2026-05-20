import { useRouter } from "next/router";
import { useMemo } from "react";
import { NavigationTertiaire } from "@/components/_commons/NavigationTertiaire/NavigationTertiaire";
import { AlbertChat } from "@/components/PagePanelAdministrateur/Albert/AlbertChat";
import { AlbertDashboard } from "@/components/PagePanelAdministrateur/Albert/AlbertDashboard";

type Onglet = "discussion" | "dashboard";

const ITEMS = [
  { value: "discussion", label: "Discussion" },
  { value: "dashboard", label: "Dashboard" },
];

const isOnglet = (value: string): value is Onglet =>
  value === "discussion" || value === "dashboard";

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

  return (
    <div>
      <NavigationTertiaire
        items={ITEMS}
        onValueChange={changerOnglet}
        value={ongletActif}
      />
      <div className="!mt-6">
        {ongletActif === "discussion" ? <AlbertChat /> : <AlbertDashboard />}
      </div>
    </div>
  );
};
