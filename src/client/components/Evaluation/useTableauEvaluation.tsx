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
import { $Enums } from "@prisma/client";
import { clsxm } from "@/utils/clsxm";
import { TableauEvaluationRow } from "@/components/Evaluation/TableauEvaluation";
import { Critere, Rattachement } from "@/server/evaluation/queries/types";
import { LigneEtapeEvaluation } from "@/components/Evaluation/LigneEtapeEvaluation";

const columnHelper = createColumnHelper<TableauEvaluationRow>();

export const useTableauEvaluation = ({
  rattachements,
  criteres,
}: {
  rattachements: Rattachement[];
  criteres: Critere[];
}) => {
  const [grouping, setGrouping] = useState<string[]>(["rattachementCode"]);
  const data = useMemo<TableauEvaluationRow[]>(() => {
    const rows: TableauEvaluationRow[] = [];

    rattachements.forEach((rattachement) => {
      rattachement.criteres.forEach((critere) => {
        rows.push({
          id: critere.id,
          type: "critere",
          rattachement,
          ficheEvaluationId: rattachement.ficheEvaluationId,
          libelle: critere.libelle,
          evaluations: critere.evaluations,
        });
      });

      rattachement.objectifs.forEach((objectif) => {
        rows.push({
          id: objectif.id,
          type: "objectif",
          rattachement,
          ficheEvaluationId: rattachement.ficheEvaluationId,
          libelle: objectif.libelle,
          evaluations: objectif.evaluations,
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
          const currentGrouping = info.table.getState().grouping[0];
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
              {(row.original.type === "objectif" ||
                currentGrouping !== "critereId") && (
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
              )}

              <div className="divide-y divide-gray-200">
                {row.original.evaluations.map((evalItem, index) => {
                  const isEditable =
                    index === 0 && !row.original.rattachement.readOnly;

                  if (
                    evalItem.etape === $Enums.etape_evaluation_enum.INSTRUCTION
                  ) {
                    return (
                      <LigneEtapeEvaluation
                        commentaire={evalItem.evaluation.commentaire}
                        commentaireLabel="Commentaire d'instruction"
                        commentaireName={commentaireName}
                        isEditable={isEditable}
                        key={evalItem.etape}
                        note={evalItem.evaluation.note}
                        noteLabel="Note d'instruction"
                        noteName={noteName}
                      />
                    );
                  } else if (
                    evalItem.etape ===
                    $Enums.etape_evaluation_enum.CONSOLIDATION
                  ) {
                    return (
                      <LigneEtapeEvaluation
                        commentaire={evalItem.evaluation.commentaire}
                        commentaireLabel="Commentaire de consolidation"
                        commentaireName={commentaireName}
                        isEditable={isEditable}
                        key={evalItem.etape}
                        note={evalItem.evaluation.note}
                        noteLabel="Note de consolidation"
                        noteName={noteName}
                      />
                    );
                  } else if (
                    evalItem.etape ===
                    $Enums.etape_evaluation_enum.AUTO_EVALUATION
                  ) {
                    return (
                      <LigneEtapeEvaluation
                        commentaire={evalItem.evaluation.commentaire}
                        commentaireLabel="Commentaire de l'auto évalué"
                        commentaireName={commentaireName}
                        isEditable={false}
                        key={evalItem.etape}
                        note={evalItem.evaluation.note}
                        noteLabel="Note auto-évaluation"
                        noteName={noteName}
                      />
                    );
                  }
                  return null;
                })}
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
