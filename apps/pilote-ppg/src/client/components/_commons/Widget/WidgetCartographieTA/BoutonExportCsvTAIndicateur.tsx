import { BoutonExportCsv } from "@/components/_commons/Widget/BoutonExportCsv";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { useExportCsv } from "@/client/hooks/useExportCsv";
import { filtrerLesTerritoires } from "@/client/utils/csv";
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
  const utils = api.useUtils();

  const { enCours, handleClick } = useExportCsv({
    nomFichier,
    territoireCode,
    construireLignes: async (territoiresPourExport) => {
      const jalons = buildJalons();

      const donneesParJalon = await Promise.all(
        jalons.map((jalon) =>
          utils.indicateur.recupererTauxAvancementTerritoires.fetch({
            indicateurId,
            chantierId,
            jalon,
          }),
        ),
      );

      const territoiresApplicables = filtrerLesTerritoires(
        donneesParJalon[0],
        territoiresPourExport,
      ).map((territoire) => territoire.territoireCode);

      return [
        [
          "Territoire",
          ...jalons.flatMap((jalon) => [
            `Taux d'avancement ${jalon}`,
            `Date ${jalon}`,
          ]),
        ],
        ...territoiresApplicables.map((code) => [
          getLabelTerritoire(code),
          ...jalons.flatMap((jalon, index) => {
            const donneesTerritoire = donneesParJalon[index].find(
              (territoire) => territoire.territoireCode === code,
            );
            const ta =
              donneesTerritoire?.tauxAvancementJalon != null
                ? String(Math.round(donneesTerritoire.tauxAvancementJalon))
                : "Non renseignée";
            const date =
              donneesTerritoire?.dateTauxAvancementAnnuel != null
                ? PiloteDateFormatter.isoDateFranceMetropolitaine(
                    donneesTerritoire.dateTauxAvancementAnnuel,
                  )
                : "Non renseignée";
            return [ta, date];
          }),
        ]),
      ];
    },
  });

  return <BoutonExportCsv enCours={enCours} onClick={handleClick} />;
};
