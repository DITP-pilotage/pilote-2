import { useMemo } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import { $Enums } from "@prisma/client";
import type { appRouter } from "@/server/infrastructure/api/trpc/routes/routes";
import { Badge, type BadgeVariant } from "@/components/shared/Badge";
import { formaterDateCourte } from "@/client/utils/date/date";
import {
  CLASSE_COLONNE_DATE,
  CLASSE_COLONNE_ID,
  CLASSE_COLONNE_NOM,
} from "@/components/_commons/TableauAdmin/constants";
import {
  tableauAdmin,
  urlStateAdmin,
} from "@/components/_commons/TableauAdmin/tableauAdminDataTable";
import { filterFnOneOf } from "@/components/shared/DataTable/filterFns";
import type { Perimetre } from "@/server/metadataChantier/queries/ListerPerimetresQuery";

export type ChantierAdminRow = inferRouterOutputs<
  typeof appRouter
>["metadataChantier"]["lister"][number];

export const STATUT_BADGE: Record<
  $Enums.type_statut,
  { label: string; type: BadgeVariant }
> = {
  BROUILLON: { label: "Brouillon", type: "green-tilleul" },
  PUBLIE: { label: "Publié", type: "success" },
  ARCHIVE: { label: "Archivé", type: "default" },
  SUPPRIME: { label: "Supprimé", type: "error" },
};

const OPTIONS_STATUT = Object.values($Enums.type_statut).map((statut) => ({
  value: statut,
  label: STATUT_BADGE[statut].label,
}));

const champsRecherche = (chantier: ChantierAdminRow) => [
  chantier.chantierId,
  chantier.chNom,
];

const columnHelper = tableauAdmin.createColumnHelper<ChantierAdminRow>();

const useTableColumns = (perimetres: Perimetre[] | undefined) =>
  useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("chantierId", {
          id: "chantierId",
          header: "ID",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_ID },
        }),
        columnHelper.accessor("chNom", {
          id: "chNom",
          header: "Nom",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_NOM },
          cell: (info) => (
            <div className="max-w-sm truncate" title={info.getValue()}>
              {info.getValue()}
            </div>
          ),
        }),
        columnHelper.accessor("chState", {
          id: "chState",
          header: "Statut",
          enableSorting: true,
          filterFn: filterFnOneOf,
          meta: {
            filter: {
              type: "checkboxes",
              label: "Statut :",
              options: OPTIONS_STATUT,
            },
          },
          cell: (info) => {
            const badge = STATUT_BADGE[info.getValue()];
            return (
              <Badge size="sm" variant={badge.type}>
                {badge.label}
              </Badge>
            );
          },
        }),
        columnHelper.accessor("perimetreId", {
          id: "perimetreId",
          header: "Périmètre",
          enableSorting: true,
          filterFn: filterFnOneOf,
          meta: {
            filter: {
              type: "multiselect",
              label: "Périmètre",
              options: (perimetres ?? []).map((perimetre) => ({
                value: perimetre.id,
                label: perimetre.nom,
              })),
              className: "max-w-fit",
              buttonClassName: "min-w-[20rem]",
            },
          },
          cell: (info) => info.row.original.perimetreNom,
          sortFn: (rowA, rowB) =>
            rowA.original.perimetreNom.localeCompare(
              rowB.original.perimetreNom,
            ),
        }),
        columnHelper.accessor("updatedAt", {
          id: "updatedAt",
          header: "Mise à jour",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_DATE },
          cell: (info) => formaterDateCourte(info.getValue()),
        }),
      ]),
    [perimetres],
  );

export const useTableauAdminChantiers = (
  chantiers: ChantierAdminRow[],
  perimetres: Perimetre[] | undefined,
) =>
  tableauAdmin.useDataTable({
    data: chantiers,
    columns: useTableColumns(perimetres),
    rowHeader: "chNom",
    getRowHref: (row) =>
      `/panel-administrateur/chantiers/${row.original.chantierId}`,
    search: champsRecherche,
    urlState: urlStateAdmin([
      { param: "statut", columnId: "chState", default: ["PUBLIE"] },
      { param: "perimetre", columnId: "perimetreId" },
    ]),
  });
