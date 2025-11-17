import { useId } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEnregistrerBrouillonCriteres } from "@/components/PageAutoEvaluation/manieres-de-servir/useEnregistrerBrouillonCriteres";
import { formaterDate } from "@/client/utils/date/date";
import { BoutonEnregistrerBrouillon } from "@/components/PageAutoEvaluation/BoutonEnregistrerBrouillon";
import { BoutonValiderSaisieCriteres } from "@/components/PageAutoEvaluation/manieres-de-servir/BoutonValiderSaisieCriteres";
import { Icone } from "@/components/_commons/Icone";
import { EtapeCriteres } from "@/components/PageAutoEvaluation/manieres-de-servir/EtapeCriteres";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import { LayoutFicheCadrage } from "@/components/Evaluation/LayoutFicheCadrage";
import { pageAutoEvaluationManieresDeServir } from "@/components/PageAutoEvaluation/manieres-de-servir/PageAutoEvaluationManieresDeServirServerSideContext";
import {
  formSchema,
  FormValuesCriteres,
} from "@/components/PageAutoEvaluation/manieres-de-servir/form";

export const FormulaireAutoEvaluationManieresDeServir = () => {
  const { autoEvaluation } =
    pageAutoEvaluationManieresDeServir.useServerSidePropsContext();
  const formId = useId();
  const enregistrerBrouillon = useEnregistrerBrouillonCriteres();

  const isReadOnly = autoEvaluation.readOnly || autoEvaluation.criteresValides;

  const form = useForm<FormValuesCriteres>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      criteres: autoEvaluation.criteres.map((critere) => ({
        id: critere.evaluation.id,
        note: critere.evaluation.note,
        commentaire: critere.evaluation.commentaire,
        annexe: critere.evaluation.annexe,
      })),
    },
  });

  return (
    <LayoutFicheCadrage>
      <main className="!bg-white py-6 pt-0 w-full">
        <FormProvider {...form}>
          <div className="relative">
            <div className="sticky top-0 bg-white mb-6">
              <div className="flex items-center justify-between mt-4 mx-auto w-full max-w-4xl px-2 py-4">
                <span className="italic text-sm">
                  Dernière modification :{" "}
                  {formaterDate(
                    autoEvaluation.dateDerniereModification,
                    "DD/MM/YYYY [à] H[h]mm",
                  )}
                </span>
                <div className="ml-auto flex items-center gap-4">
                  {autoEvaluation.readOnly ? (
                    <span className="flex gap-2 text-sm items-center">
                      <Icone
                        className="h-5 w-5"
                        icone={InformationPleineIcon}
                      />{" "}
                      Cette fiche d'évaluation a déjà été soumise.
                    </span>
                  ) : null}
                  {autoEvaluation.criteresValides &&
                  !autoEvaluation.readOnly ? (
                    <span className="flex gap-2 text-sm items-center">
                      <Icone
                        className="h-5 w-5"
                        icone={InformationPleineIcon}
                      />{" "}
                      Les manières de servir ont été validées.
                    </span>
                  ) : null}
                  {!isReadOnly && (
                    <>
                      <BoutonEnregistrerBrouillon formId={formId} />
                      <BoutonValiderSaisieCriteres
                        ficheEvaluationId={autoEvaluation.ficheEvaluationId}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
            <form
              className="bg-white mx-auto w-full max-w-4xl"
              id={formId}
              onSubmit={form.handleSubmit(enregistrerBrouillon)}
            >
              <header className="p-4 bg-dsfr-blue-france-925 border-b-2 border-black">
                <span className="font-bold text-sm">Mon auto-évaluation</span>
              </header>

              <EtapeCriteres />
            </form>
          </div>
        </FormProvider>
      </main>
    </LayoutFicheCadrage>
  );
};
