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
import type { PorteurAdminListItem } from "@/server/referentiels/porteur/queries/ListPorteursAdminQuery";
import type { PerimetreAdminListItem } from "@/server/referentiels/perimetre/queries/ListPerimetresAdminQuery";

const champsRecherche = (perimetre: PerimetreAdminListItem) => [
  perimetre.perimetreId,
  perimetre.perNom,
];

const columnHelper = tableauAdmin.createColumnHelper<PerimetreAdminListItem>();

const useTableColumns = (porteurs: PorteurAdminListItem[] | undefined) =>
  useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("perimetreId", {
          id: "perimetreId",
          header: "ID",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_ID },
        }),
        columnHelper.accessor("perNom", {
          id: "perNom",
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
        columnHelper.accessor("porteurId", {
          id: "porteurId",
          header: "Porteur",
          enableSorting: true,
          filterFn: filterFnOneOf,
          meta: {
            cellClassName: CLASSE_COLONNE_SECONDAIRE,
            filter: {
              type: "multiselect",
              label: "Porteur",
              options: (porteurs ?? []).map((porteur) => ({
                value: porteur.porteurId,
                label: porteur.porteurShort,
              })),
              className: "max-w-fit",
              buttonClassName: "min-w-[20rem]",
            },
          },
          cell: (info) => info.row.original.porteurShort ?? "-",
          sortFn: (rowA, rowB) =>
            (rowA.original.porteurShort ?? "").localeCompare(
              rowB.original.porteurShort ?? "",
            ),
        }),
        columnHelper.accessor(
          (perimetre) => statutReferentielDe(perimetre.deletedAt),
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
    [porteurs],
  );

export const useTableauAdminPerimetres = (
  perimetres: PerimetreAdminListItem[],
  porteurs: PorteurAdminListItem[] | undefined,
) =>
  tableauAdmin.useDataTable({
    data: perimetres,
    columns: useTableColumns(porteurs),
    rowHeader: "perNom",
    getRowHref: (row) =>
      `/panel-administrateur/referentiels/perimetres/${row.original.perimetreId}`,
    search: champsRecherche,
    urlState: urlStateAdmin([
      FILTRE_STATUT_REFERENTIEL,
      { param: "porteur", columnId: "porteurId" },
    ]),
  });
