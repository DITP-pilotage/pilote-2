import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import TableauRéformesAvancement from "@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement";
import TableauRéformesMétéo from "@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo";
import TypologiesPictos from "@/components/PageAccueil/PageChantiers/TableauChantiers/TypologiesPictos/TypologiesPictos";
import { DonnéesTableauChantiers } from "@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface";
import { BadgeTendance } from "@/components/PageAccueil/PageChantiers/TableauChantiers/Tendance/BadgeTendance";
import TableauChantiersEcart from "@/components/PageAccueil/PageChantiers/TableauChantiers/Écart/TableauChantiersÉcart";
import { IconeMinistere } from "@/client/utils/mapperIconeMinistereVersIcone";
import RapportDétailléTableauChantiersProps from "./RapportDétailléTableauChantiers.interface";

export default function useRapportDétailléTableauChantiers(
  données: RapportDétailléTableauChantiersProps["données"],
  chantiersSontArchives: boolean,
) {
  const reactTableColonnesHelper =
    createColumnHelper<DonnéesTableauChantiers>();

  const colonnesTableauChantiers = [
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
      enableSorting: false,
      meta: {
        width: "auto",
      },
    }),

    reactTableColonnesHelper.accessor("typologie", {
      header: "Typologie",
      id: "typologie",
      enableSorting: false,
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
      enableGlobalFilter: false,
      meta: {
        width: "8rem",
      },
    }),
    reactTableColonnesHelper.accessor("tendance", {
      header: "Tendance",
      id: "tendance",
      enableSorting: false,
      cell: (cellContext) => (
        <BadgeTendance
          estArchive={chantiersSontArchives}
          tendance={cellContext.getValue()}
        />
      ),
      enableGrouping: false,
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
      enableGlobalFilter: false,
      meta: {
        width: "11rem",
      },
    }),
    reactTableColonnesHelper.accessor("écart", {
      header: "Écart",
      id: "écart",
      enableSorting: false,
      cell: (cellContext) => (
        <TableauChantiersEcart ecart={cellContext.getValue()} />
      ),
      enableGrouping: false,
      meta: {
        width: "5.5rem",
      },
    }),
  ];
  const tableau = useReactTable({
    data: données,
    columns: colonnesTableauChantiers,
    getCoreRowModel: getCoreRowModel(),
  });

  return {
    tableau,
  };
}
