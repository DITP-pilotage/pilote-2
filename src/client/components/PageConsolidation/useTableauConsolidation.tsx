import {
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";

type RowType = "critere" | "sous-critere" | "objectif";

interface TableauConsolidationRow {
  id: string;
  type: RowType;
  rattachementLibelle: string;
  critereId?: string;
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
  criteres: SousCritere[][];
}

export function useTableauConsolidation(rattachements: Rattachement[]) {
  // Flatten the data structure into rows
  const data = useMemo<TableauConsolidationRow[]>(() => {
    const rows: TableauConsolidationRow[] = [];

    rattachements.forEach((rattachement) => {
      // Add criteres and sous-criteres
      rattachement.criteres.forEach((sousCriteresGroup) => {
        const critere = sousCriteresGroup[0]?.critere;
        if (!critere) return;

        // Add critere row (parent group)
        rows.push({
          id: `critere-${critere.id}`,
          type: "critere",
          rattachementLibelle: rattachement.libelle,
          critereId: critere.id,
          libelle: critere.libelle,
          note: null,
          statut: "",
        });

        // Add sous-critere rows
        sousCriteresGroup.forEach((sousCritere) => {
          rows.push({
            id: `sous-critere-${sousCritere.id}`,
            type: "sous-critere",
            rattachementLibelle: rattachement.libelle,
            critereId: critere.id,
            libelle: sousCritere.libelle,
            note: sousCritere.evaluation.note,
            statut: "",
          });
        });
      });

      // Add objectifs
      rattachement.objectifs.forEach((objectif) => {
        rows.push({
          id: `objectif-${objectif.id}`,
          type: "objectif",
          rattachementLibelle: rattachement.libelle,
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
          const row = info.row;
          // Only show for critere rows and objectif rows
          if (row.original.type === "sous-critere") {
            return "";
          }
          return info.getValue();
        },
        enableGrouping: false,
      }),
      columnHelper.accessor("libelle", {
        header: "Libellé",
        cell: (info) => {
          const row = info.row;
          if (row.getIsGrouped()) {
            return <strong>{info.getValue()}</strong>;
          }
          if (row.original.type === "critere") {
            return <strong>{info.getValue()}</strong>;
          }
          if (row.original.type === "sous-critere") {
            return <span className="pl-12">{info.getValue()}</span>;
          }
          return info.getValue();
        },
        aggregatedCell: (info) => {
          return <strong>{info.getValue()}</strong>;
        },
      }),
      columnHelper.accessor("note", {
        header: "Note",
        cell: (info) => info.getValue() ?? "",
        enableGrouping: false,
      }),
      columnHelper.accessor("statut", {
        header: "Statut",
        cell: (info) => info.getValue(),
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
      grouping: ["critereId"],
    },
    initialState: {
      expanded: true, // Expand all groups by default
    },
  });

  return { table };
}
