import api from "@/server/infrastructure/api/trpc/api";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { DashboardKpiCard, formatPourcentage } from "./DashboardKpiCard";

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
    <DashboardKpiCard
      label="Médiane de répartition"
      value={formatPourcentage(data.statistiques?.médiane)}
      footer={`${territoireCode} · jalon ${jalon}`}
    />
  );
};
