import { useMemo } from "react";
import { $Enums } from "@prisma/client";
import { BadgeStatutReferentiel } from "@/components/_commons/BadgeStatutReferentiel";
import { formaterDateCourte } from "@/client/utils/date/date";
import {
  CLASSE_COLONNE_DATE,
  CLASSE_COLONNE_ID,
  CLASSE_COLONNE_NOM,
  FILTRE_STATUT_REFERENTIEL,
  filtreStatutReferentiel,
  statutReferentielDe,
} from "@/components/_commons/TableauAdmin/constants";
import {
  tableauAdmin,
  urlStateAdmin,
} from "@/components/_commons/TableauAdmin/tableauAdminDataTable";
import { filterFnOneOf } from "@/components/shared/DataTable/filterFns";
import type { PorteurAdminListItem } from "@/server/metadata-porteur/queries/ListerPorteursAdminQuery";

export const TYPE_BADGE: Record<
  $Enums.porteur_type,
  { label: string; className: string }
> = {
  MIN: {
    label: "Ministère",
    className: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  },
  DAC: {
    label: "DAC",
    className: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200",
  },
  DI: {
    label: "DI",
    className: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  },
  AUTRE: {
    label: "Autre",
    className: "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200",
  },
};

const OPTIONS_TYPE_PORTEUR = Object.entries(TYPE_BADGE).map(
  ([valeur, { label }]) => ({ valeur, label }),
);

const champsRecherche = (porteur: PorteurAdminListItem) => [
  porteur.porteurId,
  porteur.porteurShort,
  porteur.porteurName,
];

const columnHelper = tableauAdmin.createColumnHelper<PorteurAdminListItem>();

const useTableColumns = () =>
  useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("porteurId", {
          id: "porteurId",
          header: "ID",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_ID },
        }),
        columnHelper.accessor("porteurShort", {
          id: "porteurShort",
          header: "Sigle",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_NOM },
        }),
        columnHelper.accessor("porteurName", {
          id: "porteurName",
          header: "Nom",
          enableSorting: true,
          meta: { cellClassName: "text-gray-700" },
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
        columnHelper.accessor("porteurType", {
          id: "porteurType",
          header: "Type",
          enableSorting: true,
          filterFn: filterFnOneOf,
          meta: {
            filter: {
              type: "checkboxes",
              label: "Type :",
              options: OPTIONS_TYPE_PORTEUR.map((option) => ({
                value: option.valeur,
                label: option.label,
              })),
            },
          },
          cell: (info) => {
            const type = info.getValue();
            const typeBadge =
              type && type in TYPE_BADGE ? TYPE_BADGE[type] : null;
            return (
              typeBadge && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge.className}`}
                >
                  {typeBadge.label}
                </span>
              )
            );
          },
        }),
        columnHelper.accessor(
          (porteur) => statutReferentielDe(porteur.deletedAt),
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

export const useTableauAdminPorteurs = (porteurs: PorteurAdminListItem[]) =>
  tableauAdmin.useDataTable({
    data: porteurs,
    columns: useTableColumns(),
    rowHeader: "porteurName",
    getRowHref: (row) =>
      `/panel-administrateur/referentiels/porteurs/${row.original.porteurId}`,
    search: champsRecherche,
    urlState: urlStateAdmin([
      FILTRE_STATUT_REFERENTIEL,
      { param: "type", columnId: "porteurType" },
    ]),
  });
