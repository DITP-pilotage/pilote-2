import { useMemo } from "react";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { getCouleurTerritoireParCode } from "@/client/utils/couleur/paletteTerritoires";
import { TerritoireLabel } from "@/components/_commons/Widget/TerritoireLabel";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { ValeurAvancementIndicateurTerritoire } from "@/server/chantiers/infrastructure/queries/RecupererValeursAvancementIndicateurTerritoiresQuery";
import { useValeursAvancementParJalon } from "@/components/_commons/Widget/WidgetCartographieValeurAvancement/useValeursAvancementParJalon";

const formatValeur = (
  valeur: number | null,
  unite: string | null,
): string | null => {
  if (valeur === null) return null;
  const unitéAffichée = unite?.toLocaleLowerCase() === "pourcentage" ? "%" : "";
  return valeur.toLocaleString() + unitéAffichée;
};

type CelluleJalon = {
  valeur: string | null;
  date: string | null;
  estApplicable: boolean | null;
};

type LigneTerritoire = {
  territoireCode: string;
  nom: string;
  couleur: string;
  estInitial: boolean;
  cellules: Map<number, CelluleJalon>;
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
    <div className="overflow-x-auto text-xs">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white z-10 min-w-[130px]" />
            {jalons.map((jalon) => (
              <th
                key={jalon}
                className={`px-3 py-2 text-center whitespace-nowrap ${
                  jalon === jalonActif ? "font-bold" : "font-semibold"
                }`}
              >
                {jalon}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne) => (
            <tr
              key={ligne.territoireCode}
              className="border-t border-dsfr-grey-925"
            >
              <td className="sticky left-0 bg-white z-10 min-w-[130px] py-2 pr-2">
                <TerritoireLabel
                  nom={ligne.nom}
                  couleur={ligne.couleur}
                  onSupprimer={
                    !ligne.estInitial
                      ? () => onSupprimerTerritoire(ligne.territoireCode)
                      : undefined
                  }
                />
              </td>
              {jalons.map((jalon) => {
                const cellule = ligne.cellules.get(jalon);
                const estActif = jalon === jalonActif;

                if (cellule?.estApplicable === false) {
                  return (
                    <td
                      key={jalon}
                      className="px-3 py-2 text-center text-gray-400 whitespace-nowrap"
                    >
                      N/A
                    </td>
                  );
                }

                return (
                  <td
                    key={jalon}
                    className="px-3 py-2 text-center whitespace-nowrap"
                  >
                    {cellule?.valeur !== null ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span
                          className={estActif ? "font-bold" : ""}
                          style={{ color: ligne.couleur }}
                        >
                          {cellule?.valeur}
                        </span>
                        {cellule?.date && (
                          <span className="text-[10px] text-gray-500">
                            (
                            {PiloteDateFormatter.isoMonthFranceMetropolitaine(
                              cellule.date,
                            )}
                            )
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
