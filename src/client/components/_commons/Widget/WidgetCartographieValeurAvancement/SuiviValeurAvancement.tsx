import { useMemo } from "react";
import { getLabelTerritoire } from "@/client/constants/territoires";
import {
  SuiviTerritoires,
  SuiviTerritoireItem,
} from "@/components/_commons/Widget/SuiviTerritoires";
import { ValeurAvancementIndicateurTerritoire } from "@/server/chantiers/infrastructure/queries/RecupererValeursAvancementIndicateurTerritoiresQuery";

const formatValeur = (valeur: number | null, unite: string | null): string => {
  if (valeur === null) return "Non renseigné";
  const unitéAffichée = unite?.toLocaleLowerCase() === "pourcentage" ? "%" : "";
  return valeur.toLocaleString() + unitéAffichée;
};

const computePourcentage = (
  valeur: number | null,
  min: number | null,
  max: number | null,
): number | null => {
  if (valeur === null) return null;
  if (min === null || max === null) return 0;
  if (max === min) return 100;
  return ((valeur - min) / (max - min)) * 100;
};

export const SuiviValeurAvancement = ({
  territoiresSelectionnes,
  onSupprimerTerritoire,
  territoireCode,
  unite,
}: {
  territoiresSelectionnes: ValeurAvancementIndicateurTerritoire[];
  onSupprimerTerritoire: (territoireCode: string) => void;
  territoireCode: string;
  unite: string | null;
}) => {
  const maxValeur = useMemo(() => {
    const valeurs = territoiresSelectionnes
      .map((territoire) => territoire.valeurAvancement)
      .filter((valeur): valeur is number => valeur !== null);
    return valeurs.length > 0 ? Math.max(...valeurs) : null;
  }, [territoiresSelectionnes]);

  const territoires: SuiviTerritoireItem[] = useMemo(
    () =>
      [...territoiresSelectionnes]
        .sort((a, b) => {
          if (a.valeurAvancement === null && b.valeurAvancement === null)
            return 0;
          if (a.valeurAvancement === null) return 1;
          if (b.valeurAvancement === null) return -1;
          return b.valeurAvancement - a.valeurAvancement;
        })
        .map((territoire) => {
          return {
            territoireCode: territoire.territoireCode,
            nom: getLabelTerritoire(territoire.territoireCode),
            estApplicable: territoire.estApplicable,
            pourcentage: computePourcentage(
              territoire.valeurAvancement,
              0,
              maxValeur,
            ),
            libelle: formatValeur(territoire.valeurAvancement, unite),
            dateMaj: territoire.dateValeurAvancement ?? null,
          };
        }),
    [territoiresSelectionnes, maxValeur, unite],
  );

  return (
    <SuiviTerritoires
      territoires={territoires}
      territoireCode={territoireCode}
      onSupprimerTerritoire={onSupprimerTerritoire}
      variant="histogram"
    />
  );
};
