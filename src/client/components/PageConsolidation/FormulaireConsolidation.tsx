import { flexRender } from "@tanstack/react-table";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pageConsolidation } from "@/components/PageConsolidation/PageConsolidationServerSideContext";
import { clsxm } from "@/utils/clsxm";
import { formSchema, FormValues } from "@/components/PageConsolidation/form";
import { useTableauConsolidation } from "./useTableauConsolidation";

export const FormulaireConsolidation = () => {
  const { rattachements } = pageConsolidation.useServerSidePropsContext();
  const { table } = useTableauConsolidation(rattachements);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objectifs: Object.fromEntries(
        rattachements
          .flatMap((rattachement) => rattachement.objectifs)
          .map((objectif) => [objectif.id, objectif.evaluation]),
      ),
      sousCriteres: Object.fromEntries(
        rattachements
          .flatMap((rattachement) => rattachement.sousCriteres)
          .map((sousCritere) => [sousCritere.id, sousCritere.evaluation]),
      ),
    },
  });
  const rows = table.getRowModel().rows;

  return (
    <FormProvider {...form}>
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr className="bg-gray-100" key={headerGroup.id}>
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
