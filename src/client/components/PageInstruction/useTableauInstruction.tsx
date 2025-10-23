import {
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { CommentaireTextareaInstruction } from "@/components/PageInstruction/CommentaireTextareaInstruction";
import { InputNoteInstruction } from "@/components/PageInstruction/InputNoteInstruction";
import { InputNote } from "@/components/_commons/InputNote";
import { pageInstruction } from "@/components/PageInstruction/PageInstructionServerSideContext";
import { clsxm } from "@/utils/clsxm";

type Evaluation = {
  id: string;
  note: number | null;
  commentaire: string;
};
type TableauInstructionRow =
  | {
      type: "critere";
      id: string;
      libelle: string;
      rattachement: {
        code: string;
        libelle: string;
        readOnly: boolean;
      };
      ficheEvaluationId: string;
      autoEvaluation: Evaluation;
      consolidation: Evaluation;
      instruction: Evaluation;
    }
  | {
      type: "objectif";
      id: string;
      libelle: string;
      rattachement: {
        code: string;
        libelle: string;
        readOnly: boolean;
      };
      ficheEvaluationId: string;
      autoEvaluation: Evaluation;
      consolidation: Evaluation;
      instruction: Evaluation;
    };

const columnHelper = createColumnHelper<TableauInstructionRow>();

export const useTableauInstruction = () => {
  const { rattachements, criteres } =
    pageInstruction.useServerSidePropsContext();
  const [grouping, setGrouping] = useState<string[]>(["rattachementCode"]);
  const data = useMemo<TableauInstructionRow[]>(() => {
    const rows: TableauInstructionRow[] = [];

    rattachements.forEach((rattachement) => {
      rattachement.criteres.forEach((critere) => {
        rows.push({
          id: critere.id,
          type: "critere",
          rattachement,
          ficheEvaluationId: rattachement.ficheEvaluationId,
          libelle: critere.libelle,
          autoEvaluation: critere.autoEvaluation,
          consolidation: critere.consolidation,
          instruction: critere.instruction,
        });
      });

      rattachement.objectifs.forEach((objectif) => {
        rows.push({
          id: objectif.id,
          type: "objectif",
          rattachement,
          ficheEvaluationId: rattachement.ficheEvaluationId,
          libelle: objectif.libelle,
          autoEvaluation: objectif.autoEvaluation,
          consolidation: objectif.consolidation,
          instruction: objectif.instruction,
        });
      });
    });

    return rows;
  }, [rattachements]);

  const columns = useMemo(
    () => [
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
        filterFn: "arrIncludesSome",
        meta: {
          filter: {
            label: "Filtrer par territoire",
            labelToutesLesOptions: "Tous les territoires",
            getValueLabel: (value) =>
              rattachements.find((rattachement) => rattachement.code === value)
                ?.libelle ?? value,
          },
          grouping: {
            label: "Territoire",
          },
        },
        getGroupingValue: (row) => row.rattachement.code,
      }),
      columnHelper.accessor("id", {
        id: "id",
        header: "Évaluation",
        cell: (info) => {
          const row = info.row;
          const commentaireName =
            info.row.original.type === "objectif"
              ? (`fichesEvaluation.${info.row.original.ficheEvaluationId}.objectifs.${info.row.original.id}.commentaire` as const)
              : (`fichesEvaluation.${info.row.original.ficheEvaluationId}.criteres.${info.row.original.id}.commentaire` as const);
          const noteName =
            info.row.original.type === "objectif"
              ? (`fichesEvaluation.${info.row.original.ficheEvaluationId}.objectifs.${info.row.original.id}.note` as const)
              : (`fichesEvaluation.${info.row.original.ficheEvaluationId}.criteres.${info.row.original.id}.note` as const);

          return (
            <div className="space-y-4">
              <div className="bg-gray-100 pb-2 border-b border-gray-200 -mx-4 px-4 pt-2 flex items-center gap-2 !mb-0">
                <span
                  className={clsxm(
                    "text-xs px-2 py-1.5 rounded-md capitalize font-medium",
                    {
                      "bg-blue-100 text-blue-600":
                        row.original.type === "critere",
                      "bg-green-100 text-green-600":
                        row.original.type === "objectif",
                    },
                  )}
                >
                  {row.original.type}
                </span>
                {row.original.libelle}
              </div>
              <div className="flex border-b border-b-gray-200 !mb-0 !-mx-4">
                <div className="flex-1 border-r border-r-gray-200 p-4">
                  <CommentaireTextareaInstruction
                    disabled={row.original.rattachement.readOnly}
                    name={commentaireName}
                  />
                </div>
                <div className="flex-shrink-0 w-[12rem] p-4">
                  <strong className="text-sm block mb-1">
                    Note d'instruction
                  </strong>
                  <div className="flex justify-end">
                    <InputNoteInstruction
                      disabled={row.original.rattachement.readOnly}
                      name={noteName}
                    />
                  </div>
                </div>
              </div>
              <div className="flex border-b border-b-gray-200 !mb-0 !-mx-4">
                <div className="flex-1 border-r border-r-gray-200 p-4">
                  <strong className="text-sm block mb-2">
                    Commentaire de consolidation
                  </strong>
                  <blockquote className="text-sm text-gray-700 italic border-l-4 border-gray-300 pl-3 py-1">
                    {row.original.consolidation.commentaire ||
                      "Aucun commentaire"}
                  </blockquote>
                </div>
                <div className="flex-shrink-0 w-[12rem] p-4">
                  <strong className="text-sm block mb-1">
                    Note de consolidation
                  </strong>
                  <div className="flex justify-end">
                    <InputNote
                      disabled
                      value={row.original.consolidation.note ?? ""}
                    />
                  </div>
                </div>
              </div>
              <div className="flex !mb-0 !-mx-4">
                <div className="flex-1 border-r border-r-gray-200 p-4">
                  <strong className="text-sm block mb-2">
                    Commentaire de l'auto évalué
                  </strong>
                  <blockquote className="text-sm text-gray-700 italic border-l-4 border-gray-300 pl-3 py-1">
                    {row.original.autoEvaluation.commentaire ||
                      "Aucun commentaire"}
                  </blockquote>
                </div>
                <div className="flex-shrink-0 w-[12rem] p-4">
                  <strong className="text-sm block mb-1">
                    Note auto-évaluation
                  </strong>
                  <div className="flex justify-end">
                    <InputNote
                      disabled
                      value={info.row.original.autoEvaluation.note ?? ""}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        },
        enableGrouping: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor((row) => (row.type === "critere" ? row.id : null), {
        id: "critereId",
        header: "Critere",
        enableColumnFilter: true,
        filterFn: "arrIncludesSome",
        meta: {
          filter: {
            label: "Filtrer par critère",
            labelToutesLesOptions: "Tous les critères",
            getValueLabel: (value) =>
              criteres.find((critere) => critere.id === value)?.libelle ??
              value,
          },
          grouping: {
            label: "Critère",
          },
        },
        getGroupingValue: (row) => (row.type === "critere" ? row.id : null),
      }),
    ],
    [rattachements, criteres],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: { grouping },
    onGroupingChange: setGrouping,
    initialState: {
      expanded: true,
      columnVisibility: {
        critereId: false,
      },
    },
  });

  return { table };
};
