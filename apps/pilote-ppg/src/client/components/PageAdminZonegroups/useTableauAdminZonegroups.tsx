import { useMemo } from "react";
import { BadgeStatutReferentiel } from "@/components/_commons/BadgeStatutReferentiel";
import { formaterDateCourte } from "@/client/utils/date/date";
import {
  CLASSE_COLONNE_DATE,
  CLASSE_COLONNE_ID,
  CLASSE_COLONNE_NOM,
  CLASSE_COLONNE_SECONDAIRE,
  FILTRE_STATUT_REFERENTIEL,
  filtreStatutReferentiel,
  statutReferentielDe,
} from "@/components/_commons/TableauAdmin/constants";
import {
  tableauAdmin,
  urlStateAdmin,
} from "@/components/_commons/TableauAdmin/tableauAdminDataTable";
import { filterFnOneOf } from "@/components/shared/DataTable/filterFns";
import type { ZonegroupAdminListItem } from "@/server/referentiels/zonegroup/queries/ListerZonegroupsAdminQuery";

const champsRecherche = (zonegroup: ZonegroupAdminListItem) => [
  zonegroup.zoneGroupId,
  zonegroup.zgName,
];

const columnHelper = tableauAdmin.createColumnHelper<ZonegroupAdminListItem>();

const useTableColumns = () =>
  useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("zoneGroupId", {
          id: "zoneGroupId",
          header: "ID",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_ID },
        }),
        columnHelper.accessor("zgName", {
          id: "zgName",
          header: "Nom",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_NOM },
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
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_SECONDAIRE },
          cell: (info) =>
            `${info.getValue()} zone${info.getValue() !== 1 ? "s" : ""}`,
        }),
        columnHelper.accessor(
          (zonegroup) => statutReferentielDe(zonegroup.deletedAt),
          {
            id: "statut",
            header: "Statut",
            enableSorting: true,
            filterFn: filterFnOneOf,
            meta: { filter: filtreStatutReferentiel },
            cell: (info) => (
              <BadgeStatutReferentiel
                supprimé={info.getValue() === "SUPPRIME"}
              />
            ),
          },
        ),
        columnHelper.accessor("updatedAt", {
          id: "updatedAt",
          header: "Mise à jour",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_DATE },
          cell: (info) => formaterDateCourte(new Date(info.getValue())),
        }),
      ]),
    [],
  );

export const useTableauAdminZonegroups = (
  zonegroups: ZonegroupAdminListItem[],
) =>
  tableauAdmin.useDataTable({
    data: zonegroups,
    columns: useTableColumns(),
    rowHeader: "zgName",
    getRowHref: (row) =>
      `/panel-administrateur/referentiels/zonegroups/${row.original.zoneGroupId}`,
    search: champsRecherche,
    urlState: urlStateAdmin([FILTRE_STATUT_REFERENTIEL]),
  });
