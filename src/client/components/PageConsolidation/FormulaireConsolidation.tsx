import { flexRender } from "@tanstack/react-table";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { pageConsolidation } from "@/components/PageConsolidation/PageConsolidationServerSideContext";
import { clsxm } from "@/utils/clsxm";
import {
  baseFormSchema,
  FormValues,
  getCommentairesCriteresInvalides,
  getCommentairesObjectifsInvalides,
  getCriteresParDefaut,
  getObjectifsParDefaut,
} from "@/components/PageConsolidation/form";
import { useTableauConsolidation } from "./useTableauConsolidation";

export const FormulaireConsolidation = () => {
  const { rattachements } = pageConsolidation.useServerSidePropsContext();
  const { table } = useTableauConsolidation(rattachements);
  const formSchema = useMemo(() => {
    return baseFormSchema.superRefine((form, ctx) => {
      for (const objectifId of getCommentairesObjectifsInvalides(
        rattachements,
        form,
      )) {
        ctx.addIssue({
          code: "custom",
          message:
            "Le motif de consolidation est obligatoire lorsque la note est modifiée",
          path: ["objectifs", objectifId, "commentaire"],
        });
      }

      for (const critereId of getCommentairesCriteresInvalides(
        rattachements,
        form,
      )) {
        ctx.addIssue({
          code: "custom",
          message:
            "Le motif de consolidation est obligatoire lorsque la note est modifiée",
          path: ["criteres", critereId, "commentaire"],
        });
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
