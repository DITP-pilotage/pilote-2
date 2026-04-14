import api from "@/server/infrastructure/api/trpc/api";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { DashboardJaugeCard } from "./DashboardJaugeCard";

export const DashboardWidgetMedianeAvancementTerritoire = ({
  territoireCode,
  jalon,
}: {
  territoireCode: string;
  jalon: number;
}) => {
  const [data] =
    api.chantier.recupererStatistiquesAvancementTousChantiersPublies.useSuspenseQuery(
      { territoireCode, jalon },
      { staleTime: WIDGET_STALE_TIME },
    );

  return (
    <DashboardJaugeCard
      label="Médiane de répartition"
      couleur="violet"
      pourcentage={data.statistiques?.médiane ?? null}
      footer={`${territoireCode} · jalon ${jalon}`}
    />
  );
};
