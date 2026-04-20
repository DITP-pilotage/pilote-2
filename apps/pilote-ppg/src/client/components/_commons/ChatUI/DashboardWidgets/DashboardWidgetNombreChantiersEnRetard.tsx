import api from "@/server/infrastructure/api/trpc/api";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { DashboardKpiCard } from "./DashboardKpiCard";

export const DashboardWidgetNombreChantiersEnRetard = ({
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
    <DashboardKpiCard
      label="Chantiers en retard"
      value={String(data.chantiers_en_retard.length)}
      footer={`${territoireCode} · jalon ${jalon}`}
    />
  );
};
