import { useMemo } from "react";
import { Badge, type BadgeVariant } from "@/components/shared/Badge";
import { formaterDate } from "@/client/utils/date/date";
import {
  CLASSE_COLONNE_DATE,
  CLASSE_COLONNE_NOM,
  CLASSE_COLONNE_SECONDAIRE,
} from "@/components/_commons/TableauAdmin/constants";
import { tableauAdmin } from "@/components/_commons/TableauAdmin/tableauAdminDataTable";
import { filterFnOneOf } from "@/components/shared/DataTable/filterFns";
import type { StatutSeance } from "@/server/formations/domain/statutSeance";
import type { SeanceAVenir } from "@/server/formations/queries/ListSeancesAVenirQuery";

const STATUTS: Record<StatutSeance, { label: string; variant: BadgeVariant }> =
  {
    OUVERTE: { label: "Ouverte", variant: "success" },
    COMPLETE: { label: "Complète", variant: "warning" },
    ANNULEE: { label: "Annulée", variant: "error" },
  };

const formaterDateSeance = (dateDebut: string) =>
  formaterDate(dateDebut, "DD/MM/YYYY HH[:]mm") ?? "";

const champsRecherche = (seance: SeanceAVenir) => [
  seance.formation,
  ...seance.animateurs,
];

const columnHelper = tableauAdmin.createColumnHelper<SeanceAVenir>();

const useTableColumns = (formations: string[]) =>
  useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("dateDebut", {
          id: "dateDebut",
          header: "Date",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_DATE },
          cell: (info) => formaterDateSeance(info.getValue()),
        }),
        columnHelper.accessor("formation", {
          id: "formation",
          header: "Formation",
          enableSorting: true,
          filterFn: filterFnOneOf,
          meta: {
            cellClassName: CLASSE_COLONNE_NOM,
            filter: {
              type: "multiselect",
              label: "Formation :",
              options: formations.map((formation) => ({
                value: formation,
                label: formation,
              })),
            },
          },
        }),
        columnHelper.accessor("dureeMinutes", {
          id: "dureeMinutes",
          header: "Durée",
          meta: { cellClassName: CLASSE_COLONNE_SECONDAIRE },
          cell: (info) => `${info.getValue()} min`,
        }),
        columnHelper.accessor("animateurs", {
          id: "animateurs",
          header: "Animé par",
          meta: { cellClassName: CLASSE_COLONNE_SECONDAIRE },
          cell: (info) => info.getValue().join(", "),
        }),
        columnHelper.accessor("nombreInscrits", {
          id: "nombreInscrits",
          header: "Inscrits",
          enableSorting: true,
          meta: { cellClassName: "whitespace-nowrap text-gray-700" },
          cell: (info) =>
            `${info.getValue()} / ${info.row.original.nombrePlacesMax ?? "–"}`,
        }),
        columnHelper.accessor("statut", {
          id: "statut",
          header: "Statut",
          enableSorting: true,
          filterFn: filterFnOneOf,
          meta: {
            filter: {
              type: "checkboxes",
              label: "Statut :",
              options: Object.entries(STATUTS).map(([valeur, { label }]) => ({
                value: valeur,
                label,
              })),
            },
          },
          cell: (info) => {
            const statut = STATUTS[info.getValue()];
            return (
              <Badge size="sm" variant={statut.variant}>
                {statut.label}
              </Badge>
            );
          },
        }),
        columnHelper.accessor("urlInscription", {
          id: "urlInscription",
          header: "Inscription",
          cell: (info) => (
            <a
              aria-label={`Inscription à ${info.row.original.formation} du ${formaterDateSeance(info.row.original.dateDebut)} (nouvelle fenêtre)`}
              className="text-primary underline"
              href={info.getValue()}
              rel="noopener noreferrer"
              target="_blank"
            >
              Lien
            </a>
          ),
        }),
      ]),
    [formations],
  );

export const useTableauSeancesAVenir = (seances: SeanceAVenir[]) => {
  const formations = useMemo(
    () =>
      [...new Set(seances.map((seance) => seance.formation))].sort((a, b) =>
        a.localeCompare(b, "fr"),
      ),
    [seances],
  );

  return tableauAdmin.useDataTable({
    data: seances,
    columns: useTableColumns(formations),
    rowHeader: "formation",
    search: champsRecherche,
    urlState: {
      sorting: { default: [{ id: "dateDebut", desc: false }] },
      pagination: { pageSize: 20 },
      globalFilter: true,
      columnFilters: [
        { param: "statut", columnId: "statut" },
        { param: "formation", columnId: "formation" },
      ],
      shallow: true,
      history: "replace",
    },
  });
};
