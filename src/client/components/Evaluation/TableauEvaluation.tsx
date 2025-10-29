import { flexRender } from "@tanstack/react-table";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { $Enums } from "@prisma/client";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { clsxm } from "@/utils/clsxm";
import {
  Critere,
  Evaluation,
  Rattachement,
} from "@/server/evaluation/queries/types";
import { useTableauEvaluation } from "@/components/Evaluation/useTableauEvaluation";
import {
  FormValues,
  getFichesEvaluationParDefaut,
  useFormSchema,
} from "./form";
import { FiltresTableauEvaluation } from "./FiltresTableauEvaluation";
import { GroupesTableauEvaluation } from "./GroupesTableauEvaluation";

export type TableauEvaluationRow =
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
      evaluations: Array<{
        etape: $Enums.etape_evaluation_enum;
        evaluation: Evaluation;
      }>;
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
      evaluations: Array<{
        etape: $Enums.etape_evaluation_enum;
        evaluation: Evaluation;
      }>;
    };
export const TableauEvaluation = ({
  rattachements,
  criteres,
  onEnregistrer,
}: {
  rattachements: Rattachement[];
  criteres: Critere[];
  onEnregistrer: (values: FormValues) => Promise<void>;
}) => {
  const { table } = useTableauEvaluation({ rattachements, criteres });
  const formSchema = useFormSchema(rattachements);
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
        onSubmit={form.handleSubmit(onEnregistrer)}
      >
        {!estEnLectureSeule && (
          <Bouton
            className="self-end"
            label="Enregistrer le brouillon"
            type="submit"
            variant="secondary"
          />
        )}
        <FiltresTableauEvaluation table={table} />
        <GroupesTableauEvaluation table={table} />
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
              if (row.getIsGrouped()) {
                let label = "";
                let colSpan = 1;
                const groupingValue = row.groupingValue as string;

                if (groupingColumnId == "critereId") {
                  const critere = criteres.find(
                    (critereGroup) => critereGroup.id === groupingValue,
                  );
                  colSpan = 2;
                  label = critere?.libelle ?? "Objectifs";
                } else {
                  const rattachement = rattachements.find(
                    (rattachementGroup) =>
                      rattachementGroup.code === groupingValue,
                  );
                  label = rattachement?.libelle ?? "";
                }

                return (
                  <tr
                    className={clsxm("border-t border-t-2 border-primary")}
                    key={row.id}
                  >
                    <td
                      className="font-semibold text-primary px-4 py-3"
                      colSpan={colSpan}
                    >
                      {label ?? groupingValue}
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
