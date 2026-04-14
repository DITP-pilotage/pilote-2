import api from "@/server/infrastructure/api/trpc/api";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { ChantierIndicateursTable } from "@/components/_commons/ChatUI/ChantierIndicateursTable";
import { DashboardPanel } from "./DashboardPanel";

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
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-3">
        Indicateurs · {chantierId} · {territoireCode} · {jalon}
      </div>
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
