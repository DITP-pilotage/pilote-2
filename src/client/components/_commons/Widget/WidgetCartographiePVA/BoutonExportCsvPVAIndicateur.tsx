import { BoutonExportCsv } from "@/components/_commons/Widget/BoutonExportCsv";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { useExportCsv } from "@/client/hooks/useExportCsv";
import api from "@/server/infrastructure/api/trpc/api";

export const BoutonExportCsvPVAIndicateur = ({
  indicateurId,
  chantierId,
  jalon,
  nomFichier,
  territoireCode,
}: {
  indicateurId: string;
  chantierId: string;
  jalon: number;
  nomFichier: string;
  territoireCode: string;
}) => {
  const utils = api.useUtils();

  const { enCours, handleClick } = useExportCsv(
    nomFichier,
    territoireCode,
    async (territoiresPourExport) => {
      const donnees = await utils.indicateur.recupererPVATerritoires.fetch({
        indicateurId,
        chantierId,
        jalon,
      });

      return [
        ["Territoire", "Nombre de propositions"],
        ...donnees
          .filter(
            (territoire) =>
              territoire.estApplicable !== false &&
              territoiresPourExport.includes(territoire.territoireCode),
          )
          .map((territoire) => [
            getLabelTerritoire(territoire.territoireCode),
            String(territoire.nombrePropositionsValeur),
          ]),
      ];
    },
  );

  return <BoutonExportCsv enCours={enCours} onClick={handleClick} />;
};
