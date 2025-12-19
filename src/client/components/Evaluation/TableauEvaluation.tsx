import { flexRender } from "@tanstack/react-table";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { $Enums } from "@prisma/client";
import { ComponentProps, memo, useCallback, useEffect } from "react";
import Link from "next/link";
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
import { CriteresProvider } from "@/components/Evaluation/CriteresProvider";
import { AutosaveProvider } from "@/components/Evaluation/AutosaveProvider";
import { EtapeEvaluationProvider } from "@/components/Evaluation/EtapeEvaluationProvider";
import { HeaderTableauEvaluation } from "@/components/Evaluation/HeaderTableauEvaluation";
import {
  Disclosure,
  DisclosureIndicator,
} from "@/components/shared/Disclosure";
import { Icone } from "@/components/_commons/Icone";
import { QuestionIcon } from "@/components/_commons/Icones/QuestionIcon";
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
        <FormProvider {...form}>
          <div className="max-w-[1200px] mx-auto bg-white">
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

              <div className="px-6 py-3">
                <Disclosure
                  trigger={
                    <button
                      className="w-full !p-0 !text-base hover:!bg-transparent !text-primary flex items-center gap-2"
                      type="button"
                    >
                      <Icone icone={QuestionIcon} /> Comment réaliser vos
                      appréciations ?
                      <DisclosureIndicator className="ml-auto" />
                    </button>
                  }
                >
                  <div className="flex flex-col gap-2 children:!mb-0">
                    <p>
                      Renseignez ici les <strong>résultats quantitatifs</strong>{" "}
                      et les <strong>commentaires</strong> pour chaque objectif
                      individuel et manière de servir.
                    </p>

                    <p>
                      Une fois un élément évalué,{" "}
                      <strong>marquez-le comme traité</strong> pour suivre
                      l'avancement de votre travail.
                    </p>

                    <p>
                      Lorsque tous les éléments sont traités, vous pouvez{" "}
                      <strong>transmettre les résultats</strong> pour létape
                      suivante. Tant que les résultats ne sont pas transmis, ils
                      sont visibles uniquement au niveau régional et modifiables
                      à tout moment.
                    </p>

                    <p>
                      Les options de <strong>filtrage</strong> vous permettent
                      d'adapter la vue. Vous pouvez les utiliser pour travailler
                      par territoire ou par item, selon votre préférence.
                    </p>

                    <p>
                      Pour plus de détails, consultez le{" "}
                      <Link
                        href="/centre-aide-pilote-2/centre-aide-eval"
                        target="_blank"
                      >
                        centre d'aide
                      </Link>
                      .
                    </p>
                  </div>
                </Disclosure>
              </div>
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
