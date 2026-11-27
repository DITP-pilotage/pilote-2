import { api } from "@/server/framework/trpc/api";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { AffichagePublication } from "@/components/PageChantier/Publication/Affichage/AffichagePublication";
import { MeteoSyntheseDesResultats } from "@/components/PageChantier/SynthèseDesRésultatsChantier/MeteoSyntheseDesResultats";
import { DashboardPanel } from "./DashboardPanel";
import { DashboardWidgetTitle } from "./DashboardWidgetTitle";

export const DashboardWidgetSyntheseDesResultats = ({
  chantierId,
  territoireCode,
}: {
  chantierId: string;
  territoireCode: string;
}) => {
  const [synthese] =
    api.syntheseDesResultats.recupererDerniere.useSuspenseQuery(
      { chantierId, territoireCode },
      { staleTime: WIDGET_STALE_TIME },
    );

  return (
    <DashboardPanel>
      <DashboardWidgetTitle
        segments={["Synthèse des résultats", chantierId, territoireCode]}
        className="mb-3"
      />
      <AffichagePublication
        commentaire={synthese}
        aside={<MeteoSyntheseDesResultats meteo={synthese?.meteo} />}
        emptyMessage="Aucune synthèse des résultats."
      />
    </DashboardPanel>
  );
};
