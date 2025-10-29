import { flexRender } from "@tanstack/react-table";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { $Enums } from "@prisma/client";
import { ReactNode, useState } from "react";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { clsxm } from "@/utils/clsxm";
import {
  Critere,
  Evaluation,
  Rattachement,
} from "@/server/evaluation/queries/types";
import { useTableauEvaluation } from "@/components/Evaluation/useTableauEvaluation";
import {
  CritereOuObjectif,
  FicheCadrage,
} from "@/components/Evaluation/FicheCadrage";
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
      descriptif: string;
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
  const [critereOuObjectif, setCritereOuObjectif] =
    useState<CritereOuObjectif | null>(null);
  const { table } = useTableauEvaluation({
    rattachements,
    criteres,
    onCibleDetailIdChange: setCritereOuObjectif,
  });
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
      <main className="grid grid-cols-[1fr_600px] !bg-white min-h-screen">
        <form
          className="flex flex-col gap-3 ml-auto w-full max-w-[1200px] py-6 grow overflow-y-auto px-8"
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
                  const groupingValue = row.groupingValue as string;
                  let label = "";
                  let colSpan = 1;
                  let aside: ReactNode = null;

                  if (groupingColumnId == "critereId") {
                    const critere = criteres.find(
                      (critereGroup) => critereGroup.id === groupingValue,
                    );
                    if (critere == null)
                      throw new Error(`Critère introuvable : ${groupingValue}`);
                    colSpan = 2;
                    label = critere?.libelle ?? "Objectifs";
                    aside = (
                      <div>
                        <Bouton
                          label="Fiche de cadrage"
                          onClick={() =>
                            setCritereOuObjectif({ type: "critere", critere })
                          }
                          size="sm"
                          variant="secondary"
                        />
                      </div>
                    );
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
                      <td className="px-4 py-3" colSpan={colSpan}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary">
                            {label ?? groupingValue}
                          </span>

                          {aside}
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={row.id}>
                    {row
                      .getVisibleCells()
                      .filter((cell) => {
                        if (
                          table.getState().grouping[0] === "rattachementCode"
                        ) {
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
        <FicheCadrage critereOuObjectif={critereOuObjectif} />
      </main>
    </FormProvider>
  );
};
