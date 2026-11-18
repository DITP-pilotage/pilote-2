import { useRouter } from "next/router";
import { ComponentType, useMemo } from "react";
import { Tabs } from "@/components/shared/Tabs";
import { SeancesAVenir } from "@/components/PagePanelAdministrateur/Formations/SeancesAVenir";

type Onglet = "seances-a-venir";

const ITEMS: { value: Onglet; label: string }[] = [
  { value: "seances-a-venir", label: "Séances à venir" },
];

const isOnglet = (value: string): value is Onglet =>
  ITEMS.some((item) => item.value === value);

const CONTENU: Record<Onglet, ComponentType> = {
  "seances-a-venir": SeancesAVenir,
};

export const FormationsPanel = () => {
  const router = useRouter();

  const ongletActif: Onglet = useMemo(() => {
    const queryParam = router.query.onglet;
    const valeur = Array.isArray(queryParam) ? queryParam[0] : queryParam;
    return valeur && isOnglet(valeur) ? valeur : "seances-a-venir";
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
