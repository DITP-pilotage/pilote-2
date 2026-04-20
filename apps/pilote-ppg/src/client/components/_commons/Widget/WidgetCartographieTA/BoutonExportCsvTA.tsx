import { BoutonExportCsv } from "@/components/_commons/Widget/BoutonExportCsv";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { useExportCsv } from "@/client/hooks/useExportCsv";
import { filtrerLesTerritoires } from "@/client/utils/csv";
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
  const utils = api.useUtils();

  const { enCours, handleClick } = useExportCsv({
    nomFichier,
    territoireCode,
    construireLignes: async (territoiresPourExport) => {
      const donnees =
        await utils.chantier.recupererTauxAvancementTerritoires.fetch({
          chantierIds,
          jalon,
        });

      return [
        ["Territoire", "Taux d'avancement", "Date"],
        ...filtrerLesTerritoires(donnees, territoiresPourExport).map(
          (territoire) => [
            getLabelTerritoire(territoire.territoireCode),
            territoire.tauxAvancementJalon !== null
              ? String(Math.round(territoire.tauxAvancementJalon))
              : "Non renseignée",
            territoire.dateTauxAvancementAnnuel !== null
              ? PiloteDateFormatter.isoDateFranceMetropolitaine(
                  territoire.dateTauxAvancementAnnuel,
                )
              : "Non renseignée",
          ],
        ),
      ];
    },
  });

  return <BoutonExportCsv enCours={enCours} onClick={handleClick} />;
};
