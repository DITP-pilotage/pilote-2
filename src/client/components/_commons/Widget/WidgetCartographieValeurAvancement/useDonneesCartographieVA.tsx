import { useMemo } from "react";
import { interpolerCouleurs } from "@/client/utils/couleur/couleur";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { CartographieV2Donnee } from "@/components/_commons/CartographieV2/types";
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieAvancement";
import { ValeurAvancementIndicateurTerritoire } from "@/server/chantiers/infrastructure/queries/RecupererValeursAvancementIndicateurTerritoiresQuery";

const COULEUR_DÉPART = "#8bcdb1";
const COULEUR_ARRIVÉE = "#083a25";
const REMPLISSAGE_PAR_DÉFAUT =
  ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS.DÉFAUT.remplissage;
const REMPLISSAGE_NON_APPLICABLE =
  ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS.NON_APPLICABLE.remplissage;

const formatValeur = (valeur: number | null, unite: string | null): string => {
  if (valeur === null) return "Non renseigné";
  const unitéAffichée = unite?.toLocaleLowerCase() === "pourcentage" ? "%" : "";
  return valeur.toLocaleString() + unitéAffichée;
};

const déterminerRemplissage = (
  valeur: number | null,
  valeurMin: number | null,
  valeurMax: number | null,
  estApplicable: boolean | null,
): string => {
  if (estApplicable === false) return REMPLISSAGE_NON_APPLICABLE;
  if (valeur === null || valeurMin === null || valeurMax === null)
    return REMPLISSAGE_PAR_DÉFAUT;
  if (valeurMin === valeurMax) return COULEUR_DÉPART;

  const pourcentageInterpolation =
    (100 * (valeur - valeurMin)) / (valeurMax - valeurMin);
  return interpolerCouleurs(
    COULEUR_DÉPART,
    COULEUR_ARRIVÉE,
    pourcentageInterpolation,
  );
};

export const useDonneesCartographieVA = (
  territoires: ValeurAvancementIndicateurTerritoire[],
  valeurMin: number | null,
  valeurMax: number | null,
  jalon: number,
  unite: string | null,
) => {
  return useMemo(() => {
    return territoires.reduce(
      (acc, territoire) => {
        const détails = récupérerDétailsSurUnTerritoire(
          territoire.territoireCode,
        );

        return {
          ...acc,
          [territoire.territoireCode]: {
            remplissage: déterminerRemplissage(
              territoire.valeurAvancement,
              valeurMin,
              valeurMax,
              territoire.estApplicable,
            ),
            libelle: détails?.nomAffiché ?? territoire.territoireCode,
            contenuInfoBulle:
              territoire.estApplicable === false ? (
                <div className="fr-text--bold">Non applicable</div>
              ) : (
                <>
                  <div className="flex justify-center align-center fr-text--bold">
                    <div className="fr-mr-1w">VA :</div>
                    <div>
                      {formatValeur(territoire.valeurAvancement, unite)}
                    </div>
                  </div>
                  <div className="flex justify-center align-center">
                    <div className="fr-mr-1w">{`VC ${jalon} : `}</div>
                    <div>
                      {formatValeur(territoire.valeurCibleAnnuelle, unite)}
                    </div>
                  </div>
                </>
              ),
          },
        };
      },
      {} as Record<string, CartographieV2Donnee>,
    );
  }, [territoires, valeurMin, valeurMax, jalon, unite]);
};
