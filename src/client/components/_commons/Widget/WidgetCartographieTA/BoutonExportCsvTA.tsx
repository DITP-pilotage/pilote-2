import { useState } from "react";
import { BoutonExportCsv } from "@/components/_commons/Widget/BoutonExportCsv";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { genererContenuCsv, telechargerCsv } from "@/client/utils/csv";
import { useTerritoiresCompares } from "@/client/hooks/useTerritoiresCompares";
import api from "@/server/infrastructure/api/trpc/api";

export const BoutonExportCsvTA = ({
  chantierIds,
  jalon,
  nomFichier,
  territoireCode,
}: {
  chantierIds: string[];
  jalon: number;
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
      const territoiresPourExport = [
        territoireCode,
        ...territoiresCompares.split(",").filter(Boolean),
      ].filter((code, index, self) => self.indexOf(code) === index);

      const donnees =
        await utils.chantier.recupererTauxAvancementTerritoires.fetch({
          chantierIds,
          jalon,
        });

      const lignesFiltrees = donnees.filter(
        (territoire) =>
          territoire.estApplicable !== false &&
          territoiresPourExport.includes(territoire.territoireCode),
      );

      const lignes: string[][] = [
        ["Territoire", "Taux d'avancement", "Date"],
        ...lignesFiltrees.map((territoire) => [
          getLabelTerritoire(territoire.territoireCode),
          territoire.tauxAvancementJalon !== null
            ? String(Math.round(territoire.tauxAvancementJalon))
            : "Non renseignée",
          territoire.dateTauxAvancementAnnuel !== null
            ? PiloteDateFormatter.isoDateFranceMetropolitaine(
                territoire.dateTauxAvancementAnnuel,
              )
            : "Non renseignée",
        ]),
      ];

      telechargerCsv(genererContenuCsv(lignes), nomFichier);
    } finally {
      setEnCours(false);
    }
  };

  return <BoutonExportCsv enCours={enCours} onClick={handleClick} />;
};
