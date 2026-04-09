import api from "@/server/infrastructure/api/trpc/api";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { DashboardKpiCard, formatPourcentage } from "./DashboardKpiCard";

export const DashboardWidgetTauxAvancementTerritoire = ({
  territoireCode,
  jalon,
}: {
  territoireCode: string;
  jalon: number;
}) => {
  const [data] =
    api.chantier.recupererTauxAvancementTerritoire.useSuspenseQuery(
      { territoireCode, jalon },
      { staleTime: WIDGET_STALE_TIME },
    );

  return (
    <DashboardKpiCard
      label="Taux d'avancement"
      value={formatPourcentage(data.taux_avancement)}
      footer={`${territoireCode} · jalon ${jalon}`}
    />
  );
};
