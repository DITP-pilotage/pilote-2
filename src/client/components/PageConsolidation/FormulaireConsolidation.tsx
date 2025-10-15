import { flexRender } from "@tanstack/react-table";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { pageConsolidation } from "@/components/PageConsolidation/PageConsolidationServerSideContext";
import { clsxm } from "@/utils/clsxm";
import {
  baseFormSchema,
  FormValues,
  getCriteresParDefaut,
  getObjectifsParDefaut,
} from "@/components/PageConsolidation/form";
import { ConsolidationData } from "@/server/evaluation/queries/AfficherConsolidationQuery";
import { useTableauConsolidation } from "./useTableauConsolidation";

const getAutoEvaluationCritere = (
  rattachement: ConsolidationData[number],
  critereId: string,
) => {
  return rattachement.criteres.find((critere) => critere.id === critereId)
    ?.autoEvaluation;
};

const getAutoEvaluationObjectif = (
  rattachement: ConsolidationData[number],
  objectifId: string,
) => {
  return rattachement.objectifs.find((objectif) => objectif.id === objectifId)
    ?.autoEvaluation;
};

export const FormulaireConsolidation = () => {
  const { rattachements } = pageConsolidation.useServerSidePropsContext();
  const { table } = useTableauConsolidation(rattachements);
  const formSchema = useMemo(() => {
    return baseFormSchema.superRefine((obj, ctx) => {
      for (const rattachement of rattachements) {
        for (const objectif of rattachement.objectifs) {
          const autoEvaluation = getAutoEvaluationObjectif(
            rattachement,
            objectif.id,
          );
          const consolidationEvaluation = obj.objectifs[objectif.id];

          if (
            autoEvaluation?.note != consolidationEvaluation.note &&
            !consolidationEvaluation.commentaire
          ) {
            ctx.addIssue({
              code: "custom",
              message:
                "Le motif de consolidation est obligatoire lorsque la note est modifiée",
              path: ["objectifs", objectif.id, "commentaire"],
            });
          }
        }
      }
    });
  }, [rattachements]);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      objectifs: getObjectifsParDefaut(rattachements),
      criteres: getCriteresParDefaut(rattachements),
    },
  });
  const rows = table.getRowModel().rows;

  return (
    <FormProvider {...form}>
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr className="bg-dsfr-alt-blue-france" key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  className="border border-gray-300 px-4 py-3 text-left font-semibold"
                  key={header.id}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map((row, index) => {
            if (row.getIsGrouped() && row.original.type === "objectif")
              return null;
            if (row.depth === 0) return null;

            return (
              <tr
                className={clsxm({
                  "bg-gray-50": row.getIsGrouped(),
                  "border-t border-t-2 border-primary":
                    rows[index - 1]?.depth === 0,
                })}
                key={row.id}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    className="border border-gray-300 px-4 py-2"
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </FormProvider>
  );
};
