import { useMemo } from "react";
import { Badge, type BadgeVariant } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import {
  CLASSE_COLONNE_DATE,
  CLASSE_COLONNE_SECONDAIRE,
} from "@/components/_commons/TableauAdmin/constants";
import { tableauAdmin } from "@/components/_commons/TableauAdmin/tableauAdminDataTable";
import { filterFnOneOf } from "@/components/shared/DataTable/filterFns";
import type { StatutPeriode } from "@/server/formations/domain/periodeInformation";
import type { PeriodeInformation } from "@/server/formations/queries/ListPeriodesInformationQuery";
import { formaterJour } from "./formaterPeriodes";

const STATUTS: Record<StatutPeriode, { label: string; variant: BadgeVariant }> =
  {
    A_VENIR: { label: "À venir", variant: "info" },
    EN_COURS: { label: "En cours", variant: "success" },
    PASSEE: { label: "Passée", variant: "default" },
    SUPPRIMEE: { label: "Supprimée", variant: "default" },
  };

const estModifiable = (periode: PeriodeInformation) =>
  periode.statut === "A_VENIR" || periode.statut === "EN_COURS";

const nomsFormations = (periode: PeriodeInformation) =>
  periode.motifs.map((motif) => motif.nom);

const columnHelper = tableauAdmin.createColumnHelper<PeriodeInformation>();

const useTableColumns = ({
  modifier,
  supprimer,
}: {
  modifier: (periode: PeriodeInformation) => void;
  supprimer: (periode: PeriodeInformation) => void;
}) =>
  useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("dateDebut", {
          id: "dateDebut",
          header: "Du",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_DATE },
          cell: (info) => formaterJour(info.getValue()),
        }),
        columnHelper.accessor("dateFin", {
          id: "dateFin",
          header: "Au",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_DATE },
          cell: (info) => formaterJour(info.getValue()),
        }),
        columnHelper.display({
          id: "formations",
          header: "Formations",
          meta: { cellClassName: CLASSE_COLONNE_SECONDAIRE },
          cell: ({ row }) => nomsFormations(row.original).join(", "),
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
        columnHelper.display({
          id: "actions",
          header: "Actions",
          cell: ({ row }) =>
            estModifiable(row.original) ? (
              <div className="flex gap-4">
                <Button onClick={() => modifier(row.original)} variant="link">
                  Modifier
                </Button>
                <Button onClick={() => supprimer(row.original)} variant="link">
                  Supprimer
                </Button>
              </div>
            ) : null,
        }),
      ]),
    [modifier, supprimer],
  );

export const useTableauPeriodesInformation = ({
  periodes,
  modifier,
  supprimer,
}: {
  periodes: PeriodeInformation[];
  modifier: (periode: PeriodeInformation) => void;
  supprimer: (periode: PeriodeInformation) => void;
}) =>
  tableauAdmin.useDataTable({
    data: periodes,
    columns: useTableColumns({ modifier, supprimer }),
    rowHeader: "dateDebut",
    search: nomsFormations,
    urlState: {
      sorting: { default: [{ id: "dateDebut", desc: true }] },
      pagination: { pageSize: 20 },
      globalFilter: true,
      columnFilters: [{ param: "statut", columnId: "statut" }],
      shallow: true,
      history: "replace",
    },
  });
