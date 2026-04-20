import { useMemo } from "react";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { getCouleurTerritoireParCode } from "@/client/utils/couleur/paletteTerritoires";
import { TauxAvancementComparaisonTerritoireViewModel } from "@/server/chantiers/app/contrats/TauxAvancementComparaisonTerritoireViewModel";
import {
  TableauEvolution,
  CelluleJalon,
  LigneTerritoire,
} from "@/components/_commons/Widget/TableauEvolution";
import { useTauxAvancementParJalon } from "./useTauxAvancementParJalon";

const formatValeurTA = (valeur: number | null | undefined): string | null => {
  if (valeur === null || valeur === undefined) return null;
  return `${Math.round(valeur)}%`;
};

export const TableauEvolutionTA = ({
  indicateurId,
  chantierId,
  territoiresSelectionnes,
  territoireCode,
  onSupprimerTerritoire,
  jalonActif,
}: {
  indicateurId: string;
  chantierId: string;
  territoiresSelectionnes: TauxAvancementComparaisonTerritoireViewModel[];
  territoireCode: string;
  onSupprimerTerritoire: (territoireCode: string) => void;
  jalonActif: number;
}) => {
  const { jalons, donneesParJalon } = useTauxAvancementParJalon({
    indicateurId,
    chantierId,
  });

  const lignes: LigneTerritoire[] = useMemo(() => {
    return territoiresSelectionnes.map((territoire) => {
      const cellules = new Map<number, CelluleJalon>();

      for (const jalon of jalons) {
        const donnees = donneesParJalon.get(jalon);
        const donneeTerritoire = donnees?.find(
          (d) => d.territoireCode === territoire.territoireCode,
        );

        cellules.set(jalon, {
          valeur: donneeTerritoire
            ? formatValeurTA(donneeTerritoire.tauxAvancementJalon)
            : null,
          date: donneeTerritoire?.dateTauxAvancementAnnuel ?? null,
          estApplicable: donneeTerritoire?.estApplicable ?? null,
        });
      }

      return {
        territoireCode: territoire.territoireCode,
        nom: getLabelTerritoire(territoire.territoireCode),
        couleur: getCouleurTerritoireParCode(territoire.territoireCode),
        estInitial: territoire.territoireCode === territoireCode,
        cellules,
      };
    });
  }, [territoiresSelectionnes, donneesParJalon, jalons, territoireCode]);

  return (
    <TableauEvolution
      lignes={lignes}
      jalons={jalons}
      jalonActif={jalonActif}
      onSupprimerTerritoire={onSupprimerTerritoire}
    />
  );
};
