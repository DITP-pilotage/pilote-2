import { flexRender } from "@tanstack/react-table";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pageConsolidation } from "@/components/PageConsolidation/PageConsolidationServerSideContext";
import { clsxm } from "@/utils/clsxm";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { FiltresConsolidation } from "@/components/PageConsolidation/FiltresConsolidation";
import {
  FormValues,
  getFichesEvaluationParDefaut,
  useFormSchema,
} from "./form";
import { useEnregistrerBrouillonConsolidation } from "./useEnregistrerBrouillonConsolidation";
import { useTableauConsolidation } from "./useTableauConsolidation";

export const FormulaireConsolidation = () => {
  const { rattachements } = pageConsolidation.useServerSidePropsContext();
  const { table } = useTableauConsolidation();
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
        <FiltresConsolidation table={table} />
        <table className="table-fixed w-full border-collapse border border-gray-300">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr className="bg-blue-100" key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    className={clsxm(
                      "border border-gray-300 px-4 py-3 text-left font-semibold",
                      header.id === "rattachementCode" && "w-48",
                      header.id === "id" && "w-auto",
                      (header.id === "noteAutoEvaluation" ||
                        header.id === "note") &&
                        "w-32",
                    )}
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
              // Skip group header rows
              if (row.getIsGrouped()) return null;

              // Check if this is the first row in a group
              const isFirstInGroup =
                index === 0 || rows[index - 1].getIsGrouped();

              // Calculate group size (count consecutive non-grouped rows)
              let groupSize = 0;
              if (isFirstInGroup) {
                for (
                  let i = index;
                  i < rows.length && !rows[i].getIsGrouped();
                  i++
                ) {
                  groupSize++;
                }
              }

              // Get the rattachement cell from the parent group
              const groupRow =
                isFirstInGroup && index > 0 ? rows[index - 1] : null;
              const rattachementCell = groupRow
                ?.getAllCells()
                .find((cell) => cell.column.id === "rattachementCode");

              return (
                <tr
                  className={clsxm(
                    isFirstInGroup && "border-t border-t-2 border-primary",
                  )}
                  key={row.id}
                >
                  {isFirstInGroup && rattachementCell ? (
                    <td
                      className="border border-gray-300 px-4 py-2 w-48 align-top"
                      rowSpan={groupSize}
                    >
                      {flexRender(
                        rattachementCell.column.columnDef.cell,
                        rattachementCell.getContext(),
                      )}
                    </td>
                  ) : null}

                  {row.getVisibleCells().map((cell) => {
                    // Skip rattachementCode column as we handle it separately
                    if (cell.column.id === "rattachementCode") return null;

                    return (
                      <td
                        className={clsxm(
                          "border border-gray-300 px-4 py-2",
                          cell.column.id === "id" && "w-auto",
                          (cell.column.id === "noteAutoEvaluation" ||
                            cell.column.id === "note") &&
                            "w-32",
                        )}
                        key={cell.id}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </form>
    </FormProvider>
  );
};
