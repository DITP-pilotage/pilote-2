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
import type { EngagementAdminListItem } from "@/server/metadata-engagement/queries/ListerEngagementsAdminQuery";

const champsRecherche = (engagement: EngagementAdminListItem) => [
  engagement.engagementId,
  engagement.engagementShort,
  engagement.engagementName,
];

const columnHelper = tableauAdmin.createColumnHelper<EngagementAdminListItem>();

const useTableColumns = () =>
  useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("engagementId", {
          id: "engagementId",
          header: "ID",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_ID },
        }),
        columnHelper.accessor("engagementShort", {
          id: "engagementShort",
          header: "Code",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_SECONDAIRE },
        }),
        columnHelper.accessor("engagementName", {
          id: "engagementName",
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
        columnHelper.accessor(
          (engagement) => statutReferentielDe(engagement.deletedAt),
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

export const useTableauAdminEngagements = (
  engagements: EngagementAdminListItem[],
) =>
  tableauAdmin.useDataTable({
    data: engagements,
    columns: useTableColumns(),
    rowHeader: "engagementName",
    getRowHref: (row) =>
      `/panel-administrateur/referentiels-deprecies/engagements/${row.original.engagementId}`,
    search: champsRecherche,
    urlState: urlStateAdmin([FILTRE_STATUT_REFERENTIEL]),
  });
