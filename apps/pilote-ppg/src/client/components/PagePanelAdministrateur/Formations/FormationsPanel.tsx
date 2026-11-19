import { PanelTabs } from "@/components/PagePanelAdministrateur/PanelTabs";
import { SeancesAVenir } from "@/components/PagePanelAdministrateur/Formations/SeancesAVenir";

export const FormationsPanel = () => (
  <PanelTabs
    tabs={[
      {
        value: "seances-a-venir",
        label: "Séances à venir",
        content: SeancesAVenir,
      },
    ]}
  />
);
