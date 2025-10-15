import { flexRender } from "@tanstack/react-table";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pageConsolidation } from "@/components/PageConsolidation/PageConsolidationServerSideContext";
import { clsxm } from "@/utils/clsxm";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import {
  FormValues,
  getFichesEvaluationParDefaut,
  useFormSchema,
} from "./form";
import { useEnregistrerBrouillonConsolidation } from "./useEnregistrerBrouillonConsolidation";
import { useTableauConsolidation } from "./useTableauConsolidation";

export const FormulaireConsolidation = () => {
  const { rattachements } = pageConsolidation.useServerSidePropsContext();
  const { table } = useTableauConsolidation(rattachements);
  const enregisterBrouillon = useEnregistrerBrouillonConsolidation();
  const formSchema = useFormSchema();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      fichesEvaluation: getFichesEvaluationParDefaut(rattachements),
    },
  });
  const rows = table.getRowModel().rows;

  return (
    <FormProvider {...form}>
      <form
        className="flex flex-col gap-3"
        onSubmit={form.handleSubmit(enregisterBrouillon)}
      >
        <Bouton
          className="self-end"
          label="Enregistrer le brouillon"
          type="submit"
          variant="secondary"
        />
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </form>
    </FormProvider>
  );
};
