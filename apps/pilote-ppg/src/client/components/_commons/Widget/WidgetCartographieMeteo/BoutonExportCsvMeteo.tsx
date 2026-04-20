import { BoutonExportCsv } from "@/components/_commons/Widget/BoutonExportCsv";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { useExportCsv } from "@/client/hooks/useExportCsv";
import { filtrerLesTerritoires } from "@/client/utils/csv";
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
  const utils = api.useUtils();

  const { enCours, handleClick } = useExportCsv({
    nomFichier,
    territoireCode,
    construireLignes: async (territoiresPourExport) => {
      const donnees = await utils.chantier.recupererMeteosTerritoires.fetch({
        chantierId,
        jalon,
      });

      return [
        ["Territoire", "Niveau de confiance", "Date de publication"],
        ...filtrerLesTerritoires(donnees, territoiresPourExport).map(
          (territoire) => [
            getLabelTerritoire(territoire.territoireCode),
            territoire.meteo !== null
              ? (libellesMeteos[territoire.meteo] ?? "Non renseignée")
              : "Non renseignée",
            territoire.dateDeMajQualitative !== null
              ? PiloteDateFormatter.isoDateFranceMetropolitaine(
                  territoire.dateDeMajQualitative,
                )
              : "Non renseignée",
          ],
        ),
      ];
    },
  });

  return <BoutonExportCsv enCours={enCours} onClick={handleClick} />;
};
