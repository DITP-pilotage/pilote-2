import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import api from "@/server/infrastructure/api/trpc/api";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { DashboardCardShell } from "./DashboardCardShell";

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

  const statistiques = data.statistiques;

  return (
    <DashboardCardShell
      label="Répartition territoriale"
      footer={`${territoireCode} · jalon ${jalon}`}
    >
      <div className="flex w-full items-center justify-around gap-4 flex-wrap">
        <JaugeDeProgression
          couleur="orange"
          libellé="Minimum"
          pourcentage={statistiques?.minimum ?? null}
          taille="md"
        />
        <JaugeDeProgression
          couleur="violet"
          libellé="Médiane"
          pourcentage={statistiques?.médiane ?? null}
          taille="md"
        />
        <JaugeDeProgression
          couleur="vert"
          libellé="Maximum"
          pourcentage={statistiques?.maximum ?? null}
          taille="md"
        />
      </div>
    </DashboardCardShell>
  );
};
