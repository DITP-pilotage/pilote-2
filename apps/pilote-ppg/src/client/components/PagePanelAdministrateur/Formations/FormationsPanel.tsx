import { PanelTabs } from "@/components/PagePanelAdministrateur/PanelTabs";
import { SeancesAVenir } from "@/components/PagePanelAdministrateur/Formations/SeancesAVenir";
import { ProfilsMatrice } from "@/components/PagePanelAdministrateur/Formations/ProfilsMatrice";
import { PeriodesInformation } from "@/components/PagePanelAdministrateur/Formations/PeriodesInformation";

export const FormationsPanel = () => (
  <PanelTabs
    tabs={[
      {
        value: "acces-motifs",
        label: "Accès motifs",
        content: ProfilsMatrice,
      },
      {
        value: "periodes-information",
        label: "Périodes d'information",
        content: PeriodesInformation,
      },
      {
        value: "seances-a-venir",
        label: "Séances à venir",
        content: SeancesAVenir,
      },
    ]}
  />
);
