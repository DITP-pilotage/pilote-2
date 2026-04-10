import { BoutonExportCsv } from "@/components/_commons/Widget/BoutonExportCsv";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { useExportCsv } from "@/client/hooks/useExportCsv";
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
  const utils = api.useUtils();

  const { enCours, handleClick } = useExportCsv({
    nomFichier,
    territoireCode,
    construireLignes: async (territoiresPourExport) => {
      const jalons = buildJalons();

      const donneesParJalon = await Promise.all(
        jalons.map((jalon) =>
          utils.indicateur.recupererValeursAvancementTerritoires.fetch({
            indicateurId,
            chantierId,
            jalon,
          }),
        ),
      );

      const territoiresApplicables = donneesParJalon[0]
        .filter(
          (territoire) =>
            territoire.estApplicable !== false &&
            territoiresPourExport.includes(territoire.territoireCode),
        )
        .map((territoire) => territoire.territoireCode);
      return [
        [
          "Territoire",
          ...jalons.flatMap((jalon) => [`VA ${jalon}`, `Date ${jalon}`]),
        ],
        ...territoiresApplicables.map((code) => [
          getLabelTerritoire(code),
          ...jalons.flatMap((jalon, index) => {
            const donneesTerritoire = donneesParJalon[index].find(
              (territoire) => territoire.territoireCode === code,
            );
            const va =
              donneesTerritoire?.valeurAvancement != null
                ? donneesTerritoire.valeurAvancement.toLocaleString("fr-FR")
                : "Non renseignée";
            const date =
              donneesTerritoire?.dateValeurAvancement != null
                ? PiloteDateFormatter.isoDateFranceMetropolitaine(
                    donneesTerritoire.dateValeurAvancement,
                  )
                : "Non renseignée";
            return [va, date];
          }),
        ]),
      ];
    },
  });

  return <BoutonExportCsv enCours={enCours} onClick={handleClick} />;
};
