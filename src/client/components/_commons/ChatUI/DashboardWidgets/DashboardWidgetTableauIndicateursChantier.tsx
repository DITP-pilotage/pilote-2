import api from "@/server/infrastructure/api/trpc/api";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { ChantierIndicateursTable } from "@/components/_commons/ChatUI/ChantierIndicateursTable";
import { DashboardPanel } from "./DashboardPanel";
import { DashboardWidgetTitle } from "./DashboardWidgetTitle";

export const DashboardWidgetTableauIndicateursChantier = ({
  chantierId,
  territoireCode,
  jalon,
}: {
  chantierId: string;
  territoireCode: string;
  jalon: number;
}) => {
  const [data] = api.chantier.recupererIndicateursChantier.useSuspenseQuery(
    { chantierId, territoireCode, jalon },
    { staleTime: WIDGET_STALE_TIME },
  );

  return (
    <DashboardPanel>
      <DashboardWidgetTitle
        segments={["Indicateurs", chantierId, territoireCode, String(jalon)]}
        className="mb-3"
      />
      {data.indicateurs.length === 0 ? (
        <div className="text-sm text-gray-500">
          Aucun indicateur disponible.
        </div>
      ) : (
        <ChantierIndicateursTable indicateurs={data.indicateurs} />
      )}
    </DashboardPanel>
  );
};
