import { useRouter } from "next/router";
import type { ComponentType } from "react";
import { Tabs } from "@/components/shared/Tabs";

type PanelTab = {
  value: string;
  label: string;
  content: ComponentType;
};

// Onglets d'une page du panel administrateur. L'onglet actif vit dans l'URL
// (`?onglet=`) ; sans paramètre ou avec une valeur inconnue, c'est le premier.
export const PanelTabs = ({ tabs }: { tabs: [PanelTab, ...PanelTab[]] }) => {
  const router = useRouter();

  const queryValue = router.query.onglet;
  const activeValue = Array.isArray(queryValue) ? queryValue[0] : queryValue;
  const activeTab = tabs.find((tab) => tab.value === activeValue) ?? tabs[0];

  const changeTab = (value: string) => {
    if (!tabs.some((tab) => tab.value === value)) return;
    router.replace(
      { pathname: router.pathname, query: { onglet: value } },
      undefined,
      { shallow: true },
    );
  };

  const Content = activeTab.content;

  return (
    <div>
      <Tabs items={tabs} onValueChange={changeTab} value={activeTab.value} />
      <div className="mt-6">
        <Content />
      </div>
    </div>
  );
};
