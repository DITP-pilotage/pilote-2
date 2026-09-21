import { createColumnHelper, useReactTable } from "@tanstack/react-table";
import { useMemo } from "react";
import { BadgeStatutReferentiel } from "@/components/_commons/BadgeStatutReferentiel";
import { formaterDateCourte } from "@/client/utils/date/date";
import {
  useEtatTableauAdmin,
  type ConfigFiltreColonne,
} from "@/components/_commons/TableauAdmin/useEtatTableauAdmin";
import { filtreParListeDeValeurs } from "@/components/_commons/TableauAdmin/filtreParListeDeValeurs";
import {
  FILTRE_STATUT_REFERENTIEL,
  statutReferentielDe,
} from "@/components/_commons/TableauAdmin/statutReferentiel";
import type { ZonegroupAdminListItem } from "@/server/metadataZonegroup/queries/ListerZonegroupsAdminQuery";

const FILTRES: ConfigFiltreColonne[] = [FILTRE_STATUT_REFERENTIEL];

const champsRecherche = (zonegroup: ZonegroupAdminListItem) => [
  zonegroup.zoneGroupId,
  zonegroup.zgName,
];

const columnHelper = createColumnHelper<ZonegroupAdminListItem>();

const useTableColumns = () =>
  useMemo(
    () => [
      columnHelper.accessor("zoneGroupId", {
        id: "zoneGroupId",
        header: "ID",
      }),
      columnHelper.accessor("zgName", {
        id: "zgName",
        header: "Nom",
        cell: (info) => (
          <span
            className={
              info.row.original.deletedAt !== null
                ? "line-through text-gray-400"
                : ""
            }
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("nbZones", {
        id: "nbZones",
        header: "Zones",
        cell: (info) =>
          `${info.getValue()} zone${info.getValue() !== 1 ? "s" : ""}`,
      }),
      columnHelper.accessor(
        (zonegroup) => statutReferentielDe(zonegroup.deletedAt),
        {
          id: "statut",
          header: "Statut",
          enableColumnFilter: true,
          filterFn: filtreParListeDeValeurs,
          cell: (info) => (
            <BadgeStatutReferentiel supprimé={info.getValue() === "SUPPRIME"} />
          ),
        },
      ),
      columnHelper.accessor("updatedAt", {
        id: "updatedAt",
        header: "Mise à jour",
        cell: (info) => formaterDateCourte(new Date(info.getValue())),
      }),
    ],
    [],
  );

export const useTableauAdminZonegroups = (
  zonegroups: ZonegroupAdminListItem[],
) => {
  const columns = useTableColumns();
  const { optionsTable, aDesFiltresActifs, reinitialiserLesFiltres } =
    useEtatTableauAdmin<ZonegroupAdminListItem>({
      filtres: FILTRES,
      champsRecherche,
    });

  const table = useReactTable({ data: zonegroups, columns, ...optionsTable });

  return { table, aDesFiltresActifs, reinitialiserLesFiltres };
};
