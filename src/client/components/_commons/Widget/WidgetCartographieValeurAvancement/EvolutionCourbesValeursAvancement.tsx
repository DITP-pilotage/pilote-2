import { useMemo } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { IndicateurDetailsParTerritoire } from "@/client/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface";
import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
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

  const tousLesIndicateursDetails: IndicateurDetailsParTerritoire[] =
    useMemo(() => {
      return evolutionTerritoires
        .filter((territoire) =>
          territoiresSelectionnesCodes.includes(territoire.territoireCode),
        )
        .map((territoire) => {
          const territoireDetails = récupérerDétailsSurUnTerritoire(
            territoire.territoireCode,
          );

          const données: DétailsIndicateur = {
            codeInsee: territoireDetails?.codeInsee ?? territoire.territoireCode,
            valeurInitiale: null,
            dateValeurInitiale: null,
            historiquesValeurs: territoire.historiquesValeurs,
            valeurAvancementMandat: null,
            valeurAvancement: null,
            dateValeurAvancement: null,
            dateValeurAvancementMandat: null,
            valeurCible: null,
            dateValeurCible: null,
            valeurCibleAnnuelle: null,
            dateValeurCibleAnnuelle: null,
            avancement: { global: null, annuel: null },
            proposition: null,
            propositionStatutTerritoire: null,
            propositionStatutDirectionProjet: null,
            unite: null,
            estApplicable: null,
            dateImport: null,
            ponderation: null,
            prochaineDateValeurAvancement: null,
            prochaineDateMaj: null,
            prochaineDateMajJours: null,
            estAJour: null,
            tendance: null,
            listeValeursCiblesAnnuelles:
              territoire.listeValeursCiblesAnnuelles,
          };

          return {
            territoireNom:
              territoireDetails?.nomAffiché ?? territoire.territoireCode,
            données,
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
