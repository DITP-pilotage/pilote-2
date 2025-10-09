import {
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";

type RowType = "sous-critere" | "objectif";

interface TableauConsolidationRow {
  id: string;
  type: RowType;
  rattachementLibelle: string;
  critereId: string;
  critereLibelle: string;
  libelle: string;
  note: number | null;
  statut: string;
}

interface SousCritere {
  id: string;
  critere: {
    id: string;
    libelle: string;
  };
  libelle: string;
  evaluation: {
    note: number | null;
    commentaire: string | null;
  };
}

interface Objectif {
  id: string;
  libelle: string;
  evaluation: {
    note: number | null;
    commentaire: string | null;
  };
}

interface Rattachement {
  code: string;
  libelle: string;
  objectifs: Objectif[];
  sousCriteres: SousCritere[];
}

export function useTableauConsolidation(rattachements: Rattachement[]) {
  // Flatten the data structure into rows
  const data = useMemo<TableauConsolidationRow[]>(() => {
    const rows: TableauConsolidationRow[] = [];

    rattachements.forEach((rattachement) => {
      // Add sous-criteres
      rattachement.sousCriteres.forEach((sousCritere) => {
        rows.push({
          id: `sous-critere-${sousCritere.id}`,
          type: "sous-critere",
          rattachementLibelle: rattachement.libelle,
          critereId: sousCritere.critere.id,
          critereLibelle: sousCritere.critere.libelle,
          libelle: sousCritere.libelle,
          note: sousCritere.evaluation.note,
          statut: "",
        });
      });

      // Add objectifs
      rattachement.objectifs.forEach((objectif) => {
        rows.push({
          id: `objectif-${objectif.id}`,
          type: "objectif",
          rattachementLibelle: rattachement.libelle,
          critereId: "",
          critereLibelle: "",
          libelle: objectif.libelle,
          note: objectif.evaluation.note,
          statut: "",
        });
      });
    });

    return rows;
  }, [rattachements]);

  const columnHelper = createColumnHelper<TableauConsolidationRow>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("rattachementLibelle", {
        header: "Rattachement",
        cell: (info) => {
          if (info.row.getIsGrouped()) {
            // Show rattachement for grouped critere rows
            return info.getValue();
          }
          // Show for objectif rows, hide for sous-critere rows
          if (info.row.original.type === "objectif") {
            return info.getValue();
          }
          return "";
        },
        enableGrouping: false,
      }),
      columnHelper.accessor("critereLibelle", {
        header: "Libellé",
        cell: (info) => {
          const row = info.row;
          if (row.getIsGrouped()) {
            // This is a grouped critere row
            return <strong>{row.original.critereLibelle}</strong>;
          }
          // This is a sous-critere or objectif row
          if (row.original.type === "sous-critere") {
            return <span className="pl-12">{row.original.libelle}</span>;
          }
          return row.original.libelle;
        },
        getGroupingValue: (row) => row.critereLibelle,
      }),
      columnHelper.accessor("note", {
        header: "Note",
        cell: (info) => {
          if (info.row.getIsGrouped()) {
            return "";
          }
          return info.getValue() ?? "";
        },
        enableGrouping: false,
      }),
      columnHelper.accessor("statut", {
        header: "Statut",
        cell: (info) => {
          if (info.row.getIsGrouped()) {
            return "";
          }
          return info.getValue();
        },
        enableGrouping: false,
      }),
    ],
    [columnHelper],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    state: {
      grouping: ["critereLibelle"],
    },
    initialState: {
      expanded: true, // Expand all groups by default
    },
  });

  return { table };
}
