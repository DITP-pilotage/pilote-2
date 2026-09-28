import { tableFeatures } from "@tanstack/react-table";
import TableauRéformesAvancement from "@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement";
import TableauRéformesMétéo from "@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo";
import TypologiesPictos from "@/components/PageAccueil/PageChantiers/TableauChantiers/TypologiesPictos/TypologiesPictos";
import { DonnéesTableauChantiers } from "@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface";
import { BadgeTendance } from "@/components/PageAccueil/PageChantiers/TableauChantiers/Tendance/BadgeTendance";
import TableauChantiersEcart from "@/components/PageAccueil/PageChantiers/TableauChantiers/Écart/TableauChantiersÉcart";
import { IconeMinistere } from "@/client/utils/mapperIconeMinistereVersIcone";
import { createDataTableHook } from "@/components/shared/DataTable/createDataTableHook";
import { htmlId } from "@/components/PageRapportDétaillé/PageRapportDétaillé";
import RapportDétailléTableauChantiersProps from "./RapportDétailléTableauChantiers.interface";

const rapportDétailléTableauChantiers = createDataTableHook(tableFeatures({}));

const reactTableColonnesHelper =
  rapportDétailléTableauChantiers.createColumnHelper<DonnéesTableauChantiers>();

export default function useRapportDétailléTableauChantiers(
  données: RapportDétailléTableauChantiersProps["données"],
  chantiersSontArchives: boolean,
) {
  const colonnesTableauChantiers = reactTableColonnesHelper.columns([
    reactTableColonnesHelper.accessor("nom", {
      header: "Chantiers",
      id: "nom",
      cell: (cellContext) => (
        <div className="flex gap-2">
          <div>
            <IconeMinistere
              className="text-dsfr-blue-france-sun-113"
              icone={cellContext.row.original.porteur?.icône}
            />
          </div>
          {cellContext.getValue()}
        </div>
      ),
      meta: {
        width: "auto",
      },
    }),

    reactTableColonnesHelper.accessor("typologie", {
      header: "Typologie",
      id: "typologie",
      cell: (cellContext) => (
        <TypologiesPictos typologies={cellContext.getValue()} />
      ),
      meta: {
        width: "6.5rem",
      },
    }),

    reactTableColonnesHelper.accessor("météo", {
      header: "Météo",
      id: "météo",
      cell: (cellContext) => (
        <TableauRéformesMétéo
          dateDeMàjDonnéesQualitatives={
            cellContext.row.original.dateDeMàjDonnéesQualitatives
          }
          météo={cellContext.getValue()}
        />
      ),
      meta: {
        width: "8rem",
      },
    }),
    reactTableColonnesHelper.accessor("tendance", {
      header: "Tendance",
      id: "tendance",
      cell: (cellContext) => (
        <BadgeTendance
          estArchive={chantiersSontArchives}
          tendance={cellContext.getValue()}
        />
      ),
      meta: {
        width: "7.5rem",
      },
    }),
    reactTableColonnesHelper.accessor("avancement", {
      header: "Avancement",
      id: "avancement",
      cell: (cellContext) => (
        <TableauRéformesAvancement
          avancement={cellContext.getValue()}
          dateDeMàjDonnéesQuantitatives={
            cellContext.row.original.dateDeMàjDonnéesQuantitatives
          }
          estArchive={chantiersSontArchives}
        />
      ),
      meta: {
        width: "11rem",
      },
    }),
    reactTableColonnesHelper.accessor("écart", {
      header: "Écart",
      id: "écart",
      cell: (cellContext) => (
        <TableauChantiersEcart ecart={cellContext.getValue()} />
      ),
      meta: {
        width: "5.5rem",
      },
    }),
  ]);
  const table = rapportDétailléTableauChantiers.useDataTable({
    data: données,
    columns: colonnesTableauChantiers,
    rowHeader: "nom",
    getRowHref: (row) => `#${htmlId.chantier(row.original.id)}`,
  });

  return {
    table,
  };
}
