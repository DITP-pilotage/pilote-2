import api from "@/server/infrastructure/api/trpc/api";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { DashboardChantiersListe } from "./DashboardChantiersListe";

export const DashboardWidgetListeChantiersEnRetard = ({
  territoireCode,
  jalon,
}: {
  territoireCode: string;
  jalon: number;
}) => {
  const [data] = api.chantier.recupererChantiersEnRetard.useSuspenseQuery(
    { territoireCode, jalon },
    { staleTime: WIDGET_STALE_TIME },
  );

  return (
    <DashboardChantiersListe
      titre="Chantiers en retard"
      territoireCode={territoireCode}
      lignes={data.chantiers_en_retard.map((chantier) => ({
        id: chantier.chantier.id,
        nom: chantier.chantier.nom,
        ecart: chantier.ecart,
        meteo: chantier.synthese?.meteo ?? null,
      }))}
    />
  );
};
