import { useMemo } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import type { TerritoireEvolutionDonnees } from "@/client/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/types";
import useIndicateurEvolutionNew from "@/client/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/useIndicateurEvolutionNew";
import LineChart from "@/client/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/LineChart/LineChart";

export const EvolutionCourbesValeursAvancement = ({
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
  const [evolutionTerritoires] =
    api.indicateur.recupererEvolutionValeursAvancementTerritoires.useSuspenseQuery(
      {
        indicateurId,
        chantierId,
        jalon,
      },
    );

  const tousLesIndicateursDetails: TerritoireEvolutionDonnees[] =
    useMemo(() => {
      return evolutionTerritoires
        .filter((territoire) =>
          territoiresSelectionnesCodes.includes(territoire.territoireCode),
        )
        .map((territoire) => {
          const territoireDetails = récupérerDétailsSurUnTerritoire(
            territoire.territoireCode,
          );

          return {
            territoireNom:
              territoireDetails?.nomAffiché ?? territoire.territoireCode,
            données: {
              historiquesValeurs: territoire.historiquesValeurs,
              listeValeursCiblesAnnuelles:
                territoire.listeValeursCiblesAnnuelles,
            },
          };
        });
    }, [evolutionTerritoires, territoiresSelectionnesCodes]);

  const {
    afficherLesCibles,
    setAfficherLesCibles,
    territoiresAAfficher,
    setTerritoiresAAfficher,
    getOptions,
    periodesSelectionnablesZoom,
    changerLaPeriodeSelectionnee,
    periodeSelectionnee,
  } = useIndicateurEvolutionNew({ tousLesIndicateursDetails });

  if (tousLesIndicateursDetails.length === 0) {
    return null;
  }

  return (
    <LineChart
      afficherLesCibles={afficherLesCibles}
      changerLaPeriodeSelectionnee={changerLaPeriodeSelectionnee}
      getOptions={getOptions}
      periodeSelectionnee={periodeSelectionnee}
      periodesSelectionnablesZoom={periodesSelectionnablesZoom}
      setAfficherLesCibles={setAfficherLesCibles}
      setTerritoiresAAfficher={setTerritoiresAAfficher}
      territoiresAAfficher={territoiresAAfficher}
      tousLesIndicateursDetails={tousLesIndicateursDetails}
    />
  );
};
