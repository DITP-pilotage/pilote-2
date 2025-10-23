import { flexRender } from "@tanstack/react-table";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pageConsolidation } from "@/components/PageConsolidation/PageConsolidationServerSideContext";
import { clsxm } from "@/utils/clsxm";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { FiltresConsolidation } from "@/components/PageConsolidation/FiltresConsolidation";
import { GroupesConsolidation } from "@/components/PageConsolidation/GroupesConsolidation";
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
  const estEnLectureSeule = rattachements.every(
    (rattachement) => rattachement.readOnly,
  );

  return (
    <FormProvider {...form}>
      <form
        className="flex flex-col gap-3"
        onSubmit={form.handleSubmit(enregisterBrouillon)}
      >
        {!estEnLectureSeule && (
          <Bouton
            className="self-end"
            label="Enregistrer le brouillon"
            type="submit"
            variant="secondary"
          />
        )}
        <FiltresConsolidation table={table} />
        <GroupesConsolidation table={table} />
        <table className="table-fixed w-full border-collapse border border-gray-300">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr className="bg-blue-100" key={headerGroup.id}>
                {headerGroup.headers
                  .filter((header) => {
                    if (table.getState().grouping[0] === "rattachementCode") {
                      return header.id !== "rattachementCode";
                    }

                    return true;
                  })
                  .map((header) => (
                    <th
                      className={clsxm(
                        "border border-gray-300 px-4 py-3 text-left font-semibold",
                        header.id === "rattachementCode" && "w-48",
                        header.id === "id" && "w-auto",
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
            {rows.map((row) => {
              const groupingColumnId = table.getState().grouping[0];
              if (row.getIsGrouped() && groupingColumnId !== "critereId") {
                const groupingValue = row.groupingValue as string;

                const rattachement = rattachements.find(
                  (rattachementAAfficher) =>
                    rattachementAAfficher.code === groupingValue,
                );

                return (
                  <tr
                    className={clsxm("border-t border-t-2 border-primary")}
                    key={row.id}
                  >
                    <td
                      className="font-semibold text-primary px-4 py-3"
                      colSpan={1}
                    >
                      {rattachement?.libelle ?? groupingValue}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={row.id}>
                  {row
                    .getVisibleCells()
                    .filter((cell) => {
                      if (table.getState().grouping[0] === "rattachementCode") {
                        return cell.column.id !== "rattachementCode";
                      }

                      return true;
                    })
                    .map((cell) => {
                      return (
                        <td
                          className={clsxm(
                            "border border-gray-300 px-4",
                            cell.column.id === "id" && "w-auto",
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
