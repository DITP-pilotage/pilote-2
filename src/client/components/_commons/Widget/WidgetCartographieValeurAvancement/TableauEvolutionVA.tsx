import { useMemo } from "react";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { getCouleurTerritoireParCode } from "@/client/utils/couleur/paletteTerritoires";
import { ValeurAvancementIndicateurTerritoire } from "@/server/chantiers/infrastructure/queries/RecupererValeursAvancementIndicateurTerritoiresQuery";
import {
  TableauEvolution,
  CelluleJalon,
  LigneTerritoire,
} from "@/components/_commons/Widget/TableauEvolution";
import { useValeursAvancementParJalon } from "@/components/_commons/Widget/WidgetCartographieValeurAvancement/useValeursAvancementParJalon";

const formatValeur = (
  valeur: number | null,
  unite: string | null,
): string | null => {
  if (valeur === null) return null;
  const unitéAffichée = unite?.toLocaleLowerCase() === "pourcentage" ? "%" : "";
  return valeur.toLocaleString() + unitéAffichée;
};

export const TableauEvolutionVA = ({
  indicateurId,
  chantierId,
  territoiresSelectionnes,
  territoireCode,
  onSupprimerTerritoire,
  jalonActif,
  unite,
}: {
  indicateurId: string;
  chantierId: string;
  territoiresSelectionnes: ValeurAvancementIndicateurTerritoire[];
  territoireCode: string;
  onSupprimerTerritoire: (territoireCode: string) => void;
  jalonActif: number;
  unite: string | null;
}) => {
  const { jalons, donneesParJalon } = useValeursAvancementParJalon({
    indicateurId,
    chantierId,
  });

  const lignes: LigneTerritoire[] = useMemo(() => {
    return territoiresSelectionnes.map((territoire) => {
      const details = récupérerDétailsSurUnTerritoire(
        territoire.territoireCode,
      );
      const cellules = new Map<number, CelluleJalon>();

      for (const jalon of jalons) {
        const donnees = donneesParJalon.get(jalon);
        const donneeTerritoire = donnees?.find(
          (d) => d.territoireCode === territoire.territoireCode,
        );

        cellules.set(jalon, {
          valeur: donneeTerritoire
            ? formatValeur(donneeTerritoire.valeurAvancement, unite)
            : null,
          date: donneeTerritoire?.dateValeurAvancement ?? null,
          estApplicable: donneeTerritoire?.estApplicable ?? null,
        });
      }

      return {
        territoireCode: territoire.territoireCode,
        nom: details?.nomAffiché ?? territoire.territoireCode,
        couleur: getCouleurTerritoireParCode(territoire.territoireCode),
        estInitial: territoire.territoireCode === territoireCode,
        cellules,
      };
    });
  }, [territoiresSelectionnes, donneesParJalon, jalons, unite, territoireCode]);

  return (
    <TableauEvolution
      lignes={lignes}
      jalons={jalons}
      jalonActif={jalonActif}
      onSupprimerTerritoire={onSupprimerTerritoire}
    />
  );
};
