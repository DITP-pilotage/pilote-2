import {
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { ConsolidationData } from "@/server/evaluation/queries/AfficherConsolidationQuery";

type TableauConsolidationRow =
  | {
      type: "sous-critere";
      id: string;
      libelle: string;
      critere: {
        id: string;
        libelle: string;
      };
      rattachement: {
        code: string;
        libelle: string;
      };
    }
  | {
      type: "objectif";
      id: string;
      libelle: string;
      rattachement: {
        code: string;
        libelle: string;
      };
    };

const columnHelper = createColumnHelper<TableauConsolidationRow>();

const columns = [
  columnHelper.accessor("rattachement.code", {
    id: "rattachementCode",
    header: "Rattachement",
    cell: (info) => {
      if (info.row.getIsGrouped()) {
        return info.row.original.rattachement.libelle;
      }

      if (info.row.original.type === "objectif") {
        return info.row.original.rattachement.libelle;
      }
      return "";
    },
    getGroupingValue: (row) => row.rattachement.code,
  }),
  columnHelper.accessor("critere.id", {
    id: "critereId",
    header: "Libellé",
    cell: (info) => {
      const row = info.row;
      if (row.getIsGrouped()) {
        if (row.original.type === "sous-critere") {
          return (
            <span className="font-bold">{row.original.critere.libelle}</span>
          );
        }
        return null;
      }
      if (row.original.type === "sous-critere") {
        return <span className="pl-12">{row.original.libelle}</span>;
      }
      return row.original.libelle;
    },
    getGroupingValue: (row) =>
      row.type === "sous-critere" ? row.critere.id : null,
  }),
  columnHelper.display({
    id: "note",
    header: "Note",
    cell: (info) => {
      if (info.row.getIsGrouped()) {
        return "";
      }
      return info.getValue() ?? "";
    },
    enableGrouping: false,
  }),
  columnHelper.display({
    id: "statut",
    header: "Statut",
    cell: (info) => {
      if (info.row.getIsGrouped()) {
        return "";
      }
      return info.getValue();
    },
    enableGrouping: false,
  }),
];
const grouping = ["rattachement.code"];
// const grouping = ["rattachement.code", "critereId"];

export function useTableauConsolidation(rattachements: ConsolidationData) {
  const data = useMemo<TableauConsolidationRow[]>(() => {
    const rows: TableauConsolidationRow[] = [];

    rattachements.forEach((rattachement) => {
      rattachement.sousCriteres.forEach((sousCritere) => {
        rows.push({
          id: `sous-critere-${sousCritere.id}`,
          type: "sous-critere",
          rattachement,
          critere: sousCritere.critere,
          libelle: sousCritere.libelle,
        });
      });

      rattachement.objectifs.forEach((objectif) => {
        rows.push({
          id: `objectif-${objectif.id}`,
          type: "objectif",
          rattachement,
          libelle: objectif.libelle,
        });
      });
    });

    return rows;
  }, [rattachements]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    state: { grouping },
    initialState: {
      expanded: true, // Expand all groups by default
    },
  });

  console.log(table.getRowModel().rows);

  return { table };
}
