import api from "@/server/infrastructure/api/trpc/api";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { ValeursRemarquables } from "@/components/_commons/Widget/ValeursRemarquables";

const formatValeurTA = (valeur: number | null | undefined): string | null => {
  if (valeur === null || valeur === undefined) return null;
  return `${Math.round(valeur)}%`;
};

export const DashboardWidgetValeursRemarquablesAvancement = ({
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

  const valeurs = {
    minimum: formatValeurTA(data.statistiques?.minimum),
    mediane: formatValeurTA(data.statistiques?.médiane),
    maximum: formatValeurTA(data.statistiques?.maximum),
  };

  return (
    <div className="h-full rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-3">
        Valeurs remarquables · {territoireCode} · jalon {jalon}
      </div>
      <ValeursRemarquables
        valeurs={valeurs}
        palette={{
          minimum: "#cbcbe8",
          mediane: "#6666bd",
          maximum: "#000091",
        }}
        maille="departementale"
      />
    </div>
  );
};
