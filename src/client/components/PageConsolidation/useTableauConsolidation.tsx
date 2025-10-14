import {
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { ConsolidationData } from "@/server/evaluation/queries/AfficherConsolidationQuery";
import { CommentaireTextareaConsolidation } from "@/components/PageConsolidation/CommentaireTextareaConsolidation";
import { InputNoteConsolidation } from "@/components/PageConsolidation/InputNoteConsolidation";

type TableauConsolidationRow =
  | {
      type: "critere";
      id: string;
      libelle: string;
      rattachement: {
        code: string;
        libelle: string;
      };
      evaluation: {
        id: string;
        note: number | null;
        commentaire: string;
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
      evaluation: {
        id: string;
        note: number | null;
        commentaire: string;
      };
    };

const columnHelper = createColumnHelper<TableauConsolidationRow>();

const columns = [
  columnHelper.accessor("rattachement.code", {
    id: "rattachementCode",
    header: "Rattachement",
    cell: (info) => {
      return (
        <span className="text-primary font-semibold">
          {info.row.original.rattachement.libelle}
        </span>
      );
    },
    getGroupingValue: (row) => row.rattachement.code,
  }),
  columnHelper.accessor("id", {
    id: "id",
    header: "Libellé",
    cell: (info) => {
      const row = info.row;
      const name =
        info.row.original.type === "objectif"
          ? (`objectifs.${info.row.original.id}.commentaire` as const)
          : (`criteres.${info.row.original.id}.commentaire` as const);

      return (
        <div>
          <div>{row.original.libelle}</div>
          <CommentaireTextareaConsolidation name={name} />
        </div>
      );
    },
    enableGrouping: false,
  }),
  columnHelper.display({
    id: "note",
    header: "Note",
    cell: (info) => {
      if (info.row.getIsGrouped()) {
        return null;
      }
      const name =
        info.row.original.type === "objectif"
          ? (`objectifs.${info.row.original.id}.note` as const)
          : (`criteres.${info.row.original.id}.note` as const);

      return (
        <div className="flex justify-end">
          <InputNoteConsolidation name={name} />
        </div>
      );
    },
    enableGrouping: false,
  }),
];
const grouping = ["rattachementCode"];

export const useTableauConsolidation = (rattachements: ConsolidationData) => {
  const data = useMemo<TableauConsolidationRow[]>(() => {
    const rows: TableauConsolidationRow[] = [];

    rattachements.forEach((rattachement) => {
      rattachement.criteres.forEach((critere) => {
        rows.push({
          id: critere.id,
          type: "critere",
          rattachement,
          libelle: critere.libelle,
          evaluation: critere.evaluation,
        });
      });

      rattachement.objectifs.forEach((objectif) => {
        rows.push({
          id: objectif.id,
          type: "objectif",
          rattachement,
          libelle: objectif.libelle,
          evaluation: objectif.evaluation,
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

  return { table };
};
