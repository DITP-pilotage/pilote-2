import api from "@/server/infrastructure/api/trpc/api";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { DashboardChantiersListe } from "./DashboardChantiersListe";

export const DashboardWidgetListeChantiersEnDifficulte = ({
  territoireCode,
  jalon,
}: {
  territoireCode: string;
  jalon: number;
}) => {
  const [data] = api.chantier.recupererChantiersEnDifficulte.useSuspenseQuery(
    { territoireCode, jalon },
    { staleTime: WIDGET_STALE_TIME },
  );

  return (
    <DashboardChantiersListe
      titre="Chantiers en difficulté"
      territoireCode={territoireCode}
      lignes={data.chantiers.map((chantier) => ({
        id: chantier.chantier.id,
        nom: chantier.chantier.nom,
        ecart: chantier.ecart,
        meteo: chantier.meteo,
      }))}
    />
  );
};
