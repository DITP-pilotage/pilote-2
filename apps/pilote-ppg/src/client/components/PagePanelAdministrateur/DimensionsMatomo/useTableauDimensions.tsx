import { useMemo } from "react";
import { Button } from "@/components/shared/Button";
import { tableauAdmin } from "@/components/_commons/TableauAdmin/tableauAdminDataTable";
import type { AnalyticsDimension } from "@/shared/analytics/dimensions";

export type DimensionRow = {
  dimension: AnalyticsDimension;
  slot: number | null;
};

const columnHelper = tableauAdmin.createColumnHelper<DimensionRow>();

const searchFields = (row: DimensionRow) => [row.dimension];

const useTableColumns = (edit: (row: DimensionRow) => void) =>
  useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("dimension", {
          id: "dimension",
          header: "Dimension",
          enableSorting: true,
          meta: { cellClassName: "font-mono text-sm" },
        }),
        columnHelper.accessor("slot", {
          id: "slot",
          header: "N° Matomo",
          enableSorting: true,
          cell: (info) => info.getValue() ?? "Non configurée",
        }),
        columnHelper.display({
          id: "actions",
          header: "Actions",
          cell: ({ row }) => (
            <Button onClick={() => edit(row.original)} variant="link">
              Modifier
            </Button>
          ),
        }),
      ]),
    [edit],
  );

export const useTableauDimensions = ({
  rows,
  edit,
}: {
  rows: DimensionRow[];
  edit: (row: DimensionRow) => void;
}) =>
  tableauAdmin.useDataTable({
    data: rows,
    columns: useTableColumns(edit),
    rowHeader: "dimension",
    search: searchFields,
    urlState: {
      pagination: { pageSize: 20 },
      globalFilter: true,
      shallow: true,
      history: "replace",
    },
  });
