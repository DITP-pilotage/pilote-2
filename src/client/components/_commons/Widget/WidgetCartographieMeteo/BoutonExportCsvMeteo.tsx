import { useState } from "react";
import { BoutonExportCsv } from "@/components/_commons/Widget/BoutonExportCsv";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { genererContenuCsv, telechargerCsv } from "@/client/utils/csv";
import { useTerritoiresCompares } from "@/client/hooks/useTerritoiresCompares";
import { libellesMeteos } from "@/server/domain/météo/Météo.interface";
import api from "@/server/infrastructure/api/trpc/api";

export const BoutonExportCsvMeteo = ({
  chantierId,
  jalon,
  nomFichier,
  territoireCode,
}: {
  chantierId: string;
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

      const donnees = await utils.chantier.recupererMeteosTerritoires.fetch({
        chantierId,
        jalon,
      });

      const lignesFiltrees = donnees.filter(
        (territoire) =>
          territoire.estApplicable !== false &&
          territoiresPourExport.includes(territoire.territoireCode),
      );

      const lignes: string[][] = [
        ["Territoire", "Niveau de confiance", "Date de publication"],
        ...lignesFiltrees.map((territoire) => [
          getLabelTerritoire(territoire.territoireCode),
          territoire.meteo !== null
            ? (libellesMeteos[territoire.meteo] ?? "Non renseignée")
            : "Non renseignée",
          territoire.dateDeMajQualitative !== null
            ? PiloteDateFormatter.isoDateFranceMetropolitaine(
                territoire.dateDeMajQualitative,
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
