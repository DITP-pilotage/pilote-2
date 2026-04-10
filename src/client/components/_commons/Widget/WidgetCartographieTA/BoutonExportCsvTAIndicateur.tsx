import { useState } from "react";
import { Icone } from "@/components/_commons/Icone";
import { Table2Icon } from "@/components/_commons/Icones/Table2Icon";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { genererContenuCsv, telechargerCsv } from "@/client/utils/csv";
import { useTerritoiresCompares } from "@/client/hooks/useTerritoiresCompares";
import { buildJalons } from "@/client/utils/jalons";
import api from "@/server/infrastructure/api/trpc/api";

export const BoutonExportCsvTAIndicateur = ({
  indicateurId,
  chantierId,
  nomFichier,
  territoireCode,
}: {
  indicateurId: string;
  chantierId: string;
  nomFichier: string;
  territoireCode: string;
}) => {
  const [enCours, setEnCours] = useState(false);
  const utils = api.useUtils();
  const [territoiresCompares] = useTerritoiresCompares();

  const handleClick = async () => {
    if (enCours) return;
    setEnCours(true);
    try {
      const jalons = buildJalons();

      const territoiresPourExport = [
        territoireCode,
        ...territoiresCompares.split(",").filter(Boolean),
      ].filter((code, index, self) => self.indexOf(code) === index);

      const donneesParJalon = await Promise.all(
        jalons.map((jalon) =>
          utils.indicateur.recupererTauxAvancementTerritoires.fetch({
            indicateurId,
            chantierId,
            jalon,
          }),
        ),
      );

      const tousLesCodes = new Set(
        donneesParJalon
          .flat()
          .filter(
            (territoire) =>
              territoire.estApplicable !== false &&
              territoiresPourExport.includes(territoire.territoireCode),
          )
          .map((territoire) => territoire.territoireCode),
      );

      const entetes = [
        "Territoire",
        ...jalons.flatMap((jalon) => [`TA ${jalon}`, `Date ${jalon}`]),
      ];

      const lignes: string[][] = [
        entetes,
        ...[...tousLesCodes].map((code) => {
          const colonnesJalons = jalons.flatMap((jalon, index) => {
            const donneesTerritoire = donneesParJalon[index].find(
              (territoire) => territoire.territoireCode === code,
            );
            const ta =
              donneesTerritoire?.tauxAvancementJalon !== null &&
              donneesTerritoire?.tauxAvancementJalon !== undefined
                ? String(Math.round(donneesTerritoire.tauxAvancementJalon))
                : "Non renseignée";
            const date =
              donneesTerritoire?.dateTauxAvancementAnnuel !== null &&
              donneesTerritoire?.dateTauxAvancementAnnuel !== undefined
                ? PiloteDateFormatter.isoDateFranceMetropolitaine(
                    donneesTerritoire.dateTauxAvancementAnnuel,
                  )
                : "Non renseignée";
            return [ta, date];
          });
          return [getLabelTerritoire(code), ...colonnesJalons];
        }),
      ];

      telechargerCsv(genererContenuCsv(lignes), nomFichier);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <button
      aria-busy={enCours}
      aria-label="Exporter en CSV"
      disabled={enCours}
      onClick={handleClick}
      type="button"
    >
      <Icone className="w-4 h-4" icone={Table2Icon} />
    </button>
  );
};
