import { flexRender } from "@tanstack/react-table";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { $Enums } from "@prisma/client";
import { ComponentProps, memo, useCallback, useEffect } from "react";
import { clsxm } from "@/utils/clsxm";
import {
  Critere,
  Evaluation,
  Rattachement,
} from "@/server/evaluation/queries/types";
import {
  COLONNES,
  useTableauEvaluation,
} from "@/components/Evaluation/useTableauEvaluation";
import {
  CriteresProvider,
  useCriteres,
} from "@/components/Evaluation/CriteresProvider";
import { AutosaveProvider } from "@/components/Evaluation/AutosaveProvider";
import { EtapeEvaluationProvider } from "@/components/Evaluation/EtapeEvaluationProvider";
import { HeaderTableauEvaluation } from "@/components/Evaluation/HeaderTableauEvaluation";
import {
  baseFormSchema,
  FormCommentaireName,
  FormNoteName,
  FormValues,
  getFichesEvaluationParDefaut,
} from "./form";
import { FiltresTableauEvaluation } from "./FiltresTableauEvaluation";

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
      etapeCourante: $Enums.etape_evaluation_enum;
      evaluations: Array<{
        etape: $Enums.etape_evaluation_enum;
        evaluation: Evaluation;
        dateTraitement: string | null;
      }>;
    }
  | {
      type: "objectif";
      id: string;
      libelle: string;
      descriptif: string;
      indicateurCible: string;
      rattachement: {
        code: string;
        libelle: string;
        readOnly: boolean;
      };
      ficheEvaluationId: string;
      etapeCourante: $Enums.etape_evaluation_enum;
      evaluations: Array<{
        etape: $Enums.etape_evaluation_enum;
        evaluation: Evaluation;
        dateTraitement: string | null;
      }>;
    };

export const InnerTableauEvaluation = memo(function TableauEvaluation({
  titre,
  etape,
  rattachements,
  onEnregistrer,
}: {
  titre: string;
  etape: $Enums.etape_evaluation_enum;
  rattachements: Rattachement[];
  onEnregistrer: (
    values: FormValues,
    showToast: boolean,
    fieldName?: FormCommentaireName | FormNoteName,
  ) => Promise<void>;
}) {
  const criteres = useCriteres();
  const form = useForm<FormValues>({
    resolver: zodResolver(baseFormSchema),
    mode: "onChange",
    defaultValues: {
      fichesEvaluation: getFichesEvaluationParDefaut(rattachements),
    },
  });

  const { trigger } = form;
  useEffect(() => {
    trigger();
  }, [trigger]);

  const handleAutosave = useCallback(
    async (fieldName: FormCommentaireName | FormNoteName) => {
      const fieldState = form.getFieldState(fieldName);
      if (!fieldState.invalid) {
        const values = form.getValues();
        await onEnregistrer(values, false, fieldName);
      }
    },
    [form, onEnregistrer],
  );

  const { table } = useTableauEvaluation({ rattachements });
  const rows = table.getRowModel().rows;
  const estEnLectureSeule = rattachements.every(
    (rattachement) => rattachement.readOnly,
  );

  const dateDerniereModification = rattachements.reduce<string | null>(
    (latest, rattachement) => {
      if (rattachement.dateDerniereModification == null) return latest;
      if (latest == null) return rattachement.dateDerniereModification;
      return new Date(rattachement.dateDerniereModification) > new Date(latest)
        ? rattachement.dateDerniereModification
        : latest;
    },
    null,
  );

  return (
    <EtapeEvaluationProvider value={etape}>
      <AutosaveProvider value={handleAutosave}>
        <CriteresProvider criteres={criteres}>
          <FormProvider {...form}>
            <div className="max-w-[1200px] mx-auto bg-white px-8">
              <form
                className="flex flex-col gap-3 py-6 w-full grow border-x border-gray-200"
                onSubmit={form.handleSubmit(
                  (values) => onEnregistrer(values, true),
                  () => table.resetColumnFilters(),
                )}
              >
                <HeaderTableauEvaluation
                  dateDerniereModification={dateDerniereModification}
                  estEnLectureSeule={estEnLectureSeule}
                  etape={etape}
                  titre={titre}
                />
                <FiltresTableauEvaluation table={table} />

                <table className="table-fixed w-full border-collapse">
                  <colgroup>
                    {table.getHeaderGroups()[0].headers.map((header) => (
                      <col
                        className={clsxm({
                          "w-[150px]":
                            header.column.id === COLONNES.RATTACHEMENT_CODE,
                        })}
                        key={header.id}
                      />
                    ))}
                  </colgroup>
                  <tbody>
                    {rows.map((row) => {
                      return (
                        <tr key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <td
                              className={clsxm(
                                "border border-gray-300 px-4",
                                "first:!border-l-0 last:!border-r-0",
                                "align-top",
                                cell.column.id === "id" && "w-auto",
                              )}
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
            </div>
          </FormProvider>
        </CriteresProvider>
      </AutosaveProvider>
    </EtapeEvaluationProvider>
  );
});

export const TableauEvaluation = (
  props: ComponentProps<typeof InnerTableauEvaluation> & {
    criteres: Critere[];
  },
) => {
  return (
    <CriteresProvider criteres={props.criteres}>
      <div className="bg-dsfr-alt-blue-france">
        <InnerTableauEvaluation {...props} />
      </div>
    </CriteresProvider>
  );
};
