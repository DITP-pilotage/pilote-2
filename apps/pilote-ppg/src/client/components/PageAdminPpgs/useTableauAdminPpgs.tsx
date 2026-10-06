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
import type { PpgAdminListItem } from "@/server/referentiels/ppg/queries/ListPpgsAdminQuery";

const champsRecherche = (ppg: PpgAdminListItem) => [ppg.ppgId, ppg.ppgNom];

const columnHelper = tableauAdmin.createColumnHelper<PpgAdminListItem>();

const useTableColumns = () =>
  useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("ppgId", {
          id: "ppgId",
          header: "ID",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_ID },
        }),
        columnHelper.accessor("ppgNom", {
          id: "ppgNom",
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
        columnHelper.accessor("ppgAxe", {
          id: "ppgAxe",
          header: "Axe",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_SECONDAIRE },
          cell: (info) => info.getValue() ?? "—",
        }),
        columnHelper.accessor((ppg) => statutReferentielDe(ppg.deletedAt), {
          id: "statut",
          header: "Statut",
          enableSorting: true,
          filterFn: filterFnOneOf,
          meta: { filter: filtreStatutReferentiel },
          cell: (info) => (
            <BadgeStatutReferentiel supprimé={info.getValue() === "SUPPRIME"} />
          ),
        }),
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

export const useTableauAdminPpgs = (ppgs: PpgAdminListItem[]) =>
  tableauAdmin.useDataTable({
    data: ppgs,
    columns: useTableColumns(),
    rowHeader: "ppgNom",
    getRowHref: (row) =>
      `/panel-administrateur/referentiels-deprecies/ppgs/${row.original.ppgId}`,
    search: champsRecherche,
    urlState: urlStateAdmin([FILTRE_STATUT_REFERENTIEL]),
  });
