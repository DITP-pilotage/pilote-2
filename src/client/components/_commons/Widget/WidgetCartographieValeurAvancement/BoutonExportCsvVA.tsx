import { useState } from "react";
import { BoutonExportCsv } from "@/components/_commons/Widget/BoutonExportCsv";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { genererContenuCsv, telechargerCsv } from "@/client/utils/csv";
import { useTerritoiresCompares } from "@/client/hooks/useTerritoiresCompares";
import { buildJalons } from "@/client/utils/jalons";
import api from "@/server/infrastructure/api/trpc/api";

export const BoutonExportCsvVA = ({
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
          utils.indicateur.recupererValeursAvancementTerritoires.fetch({
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
        ...jalons.flatMap((jalon) => [`VA ${jalon}`, `Date ${jalon}`]),
      ];

      const lignes: string[][] = [
        entetes,
        ...[...tousLesCodes].map((code) => {
          const colonnesJalons = jalons.flatMap((jalon, index) => {
            const donneesTerritoire = donneesParJalon[index].find(
              (territoire) => territoire.territoireCode === code,
            );
            const va =
              donneesTerritoire?.valeurAvancement !== null &&
              donneesTerritoire?.valeurAvancement !== undefined
                ? donneesTerritoire.valeurAvancement.toLocaleString("fr-FR")
                : "Non renseignée";
            const date =
              donneesTerritoire?.dateValeurAvancement !== null &&
              donneesTerritoire?.dateValeurAvancement !== undefined
                ? PiloteDateFormatter.isoDateFranceMetropolitaine(
                    donneesTerritoire.dateValeurAvancement,
                  )
                : "Non renseignée";
            return [va, date];
          });
          return [getLabelTerritoire(code), ...colonnesJalons];
        }),
      ];

      telechargerCsv(genererContenuCsv(lignes), nomFichier);
    } finally {
      setEnCours(false);
    }
  };

  return <BoutonExportCsv enCours={enCours} onClick={handleClick} />;
};
