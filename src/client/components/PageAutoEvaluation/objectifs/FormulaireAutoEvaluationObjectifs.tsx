import { useId } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pageAutoEvaluationObjectifs } from "@/components/PageAutoEvaluation/objectifs/PageAutoEvaluationObjectifsServerSideContext";
import { useEnregistrerBrouillonObjectifs } from "@/components/PageAutoEvaluation/objectifs/useEnregistrerBrouillonObjectifs";
import { formaterDate } from "@/client/utils/date/date";
import { Icone } from "@/components/_commons/Icone";
import { EtapeObjectifs } from "@/components/PageAutoEvaluation/objectifs/EtapeObjectifs";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import { LayoutFicheCadrage } from "@/components/Evaluation/LayoutFicheCadrage";
import { BoutonEnregistrerBrouillon } from "@/components/PageAutoEvaluation/BoutonEnregistrerBrouillon";
import { BoutonValiderSaisieObjectifs } from "@/components/PageAutoEvaluation/objectifs/BoutonValiderSaisieObjectifs";
import {
  formSchemaObjectifs,
  FormValuesObjectifs,
} from "@/components/PageAutoEvaluation/objectifs/form";

export const FormulaireAutoEvaluationObjectifs = () => {
  const { autoEvaluation } =
    pageAutoEvaluationObjectifs.useServerSidePropsContext();
  const formId = useId();
  const enregistrerBrouillon = useEnregistrerBrouillonObjectifs();

  const isReadOnly = autoEvaluation.readOnly || autoEvaluation.objectifsValides;

  const form = useForm<FormValuesObjectifs>({
    resolver: zodResolver(formSchemaObjectifs),
    mode: "onChange",
    defaultValues: {
      objectifs: autoEvaluation.objectifs.map((objectif) => ({
        id: objectif.evaluation.id,
        note: objectif.evaluation.note,
        commentaire: objectif.evaluation.commentaire,
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
                  {autoEvaluation.objectifsValides &&
                  !autoEvaluation.readOnly ? (
                    <span className="flex gap-2 text-sm items-center">
                      <Icone
                        className="h-5 w-5"
                        icone={InformationPleineIcon}
                      />{" "}
                      Les objectifs ont été validés.
                    </span>
                  ) : null}
                  {!isReadOnly && (
                    <>
                      <BoutonEnregistrerBrouillon formId={formId} />
                      <BoutonValiderSaisieObjectifs
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

              <EtapeObjectifs />
            </form>
          </div>
        </FormProvider>
      </main>
    </LayoutFicheCadrage>
  );
};
