import api from "@/server/infrastructure/api/trpc/api";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { DashboardKpiCard } from "./DashboardKpiCard";

export const DashboardWidgetNombreChantiersEnDifficulte = ({
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
    <DashboardKpiCard
      label="Chantiers en difficulté"
      value={String(data.chantiers_en_difficulte.length)}
      footer={`${territoireCode} · jalon ${jalon}`}
    />
  );
};
