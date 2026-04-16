import { BoutonExportCsv } from "@/components/_commons/Widget/BoutonExportCsv";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { useExportCsv } from "@/client/hooks/useExportCsv";
import { filtrerLesTerritoires } from "@/client/utils/csv";
import api from "@/server/infrastructure/api/trpc/api";

export const BoutonExportCsvPVA = ({
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
      const donnees =
        await utils.chantier.recupererPVAChantierTerritoires.fetch({
          chantierId,
          jalon,
        });

      return [
        ["Territoire", "Nombre de propositions"],
        ...filtrerLesTerritoires(donnees, territoiresPourExport).map(
          (territoire) => [
            getLabelTerritoire(territoire.territoireCode),
            String(territoire.nombrePropositionsValeur),
          ],
        ),
      ];
    },
  });

  return <BoutonExportCsv enCours={enCours} onClick={handleClick} />;
};
