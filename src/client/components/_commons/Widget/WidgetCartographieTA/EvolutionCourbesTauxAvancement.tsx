import { useMemo } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import type { TerritoireEvolutionDonnees } from "@/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/types";
import useIndicateurEvolutionNew from "@/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/useIndicateurEvolutionNew";
import LineChart from "@/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/LineChart/LineChart";
import { useModeExport } from "@/components/_commons/ComparaisonTerritoires/ModeExportContext";

export const EvolutionCourbesTauxAvancement = ({
  indicateurId,
  chantierId,
  jalon,
  territoiresSelectionnesCodes,
}: {
  indicateurId: string;
  chantierId: string;
  jalon: number;
  territoiresSelectionnesCodes: string[];
}) => {
  const [evolutionData] =
    api.indicateur.recupererEvolutionTauxAvancementTerritoires.useSuspenseQuery(
      {
        indicateurId,
        chantierId,
        jalon,
      },
    );

  const tousLesIndicateursDetails: TerritoireEvolutionDonnees[] =
    useMemo(() => {
      return evolutionData.territoires
        .filter((territoire) =>
          territoiresSelectionnesCodes.includes(territoire.territoireCode),
        )
        .map((territoire) => ({
          territoireCode: territoire.territoireCode,
          données: {
            historiquesValeurs: territoire.historiquesValeurs,
            listeValeursCiblesAnnuelles: [],
          },
        }));
    }, [evolutionData, territoiresSelectionnesCodes]);

  const modeExport = useModeExport();

  const {
    afficherLesCibles,
    setAfficherLesCibles,
    territoiresAAfficher,
    setTerritoiresAAfficher,
    getOptions,
    periodesSelectionnablesZoom,
    changerLaPeriodeSelectionnee,
    periodeSelectionnee,
  } = useIndicateurEvolutionNew({
    tousLesIndicateursDetails,
    jalon,
  });

  if (tousLesIndicateursDetails.length === 0) {
    return null;
  }

  return (
    <LineChart
      afficherInterrupteurCibles={false}
      afficherLesCibles={afficherLesCibles}
      changerLaPeriodeSelectionnee={changerLaPeriodeSelectionnee}
      chartDisplayMode="compact"
      getOptions={getOptions}
      modeImpression={modeExport}
      periodeSelectionnee={periodeSelectionnee}
      periodesSelectionnablesZoom={periodesSelectionnablesZoom}
      setAfficherLesCibles={setAfficherLesCibles}
      setTerritoiresAAfficher={setTerritoiresAAfficher}
      territoiresAAfficher={territoiresAAfficher}
      tousLesIndicateursDetails={tousLesIndicateursDetails}
    />
  );
};
