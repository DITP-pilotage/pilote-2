import { FormEvent, useId, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";
import { useEnregistrerBrouillon } from "@/components/PageEvaluation/useEnregistrerBrouillon";
import { formSchema, FormValues } from "@/components/PageEvaluation/form";
import { formaterDate } from "@/client/utils/date/date";
import { BoutonEnregistrerBrouillon } from "@/components/PageEvaluation/BoutonEnregistrerBrouillon";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import { ArrowLine3Icon } from "@/components/_commons/Icones/ArrowLine3Icon";
import { EtapeCriteres } from "@/components/PageEvaluation/EtapeCriteres";
import { EtapeObjectifs } from "@/components/PageEvaluation/EtapeObjectifs";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import { BoutonSoumettreAutoEvaluation } from "@/components/PageEvaluation/BoutonSoumettreAutoEvaluation";

export const FormulaireEvaluation = () => {
  const { autoEvaluation } = pageEvaluation.useServerSidePropsContext();
  const [etape, setEtape] = useState<"criteres" | "objectifs">("criteres");
  const formId = useId();
  const enregistrerBrouillon = useEnregistrerBrouillon();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      criteres: autoEvaluation.criteres.map((critere) => ({
        sousCriteres: critere.sousCriteres.map((sousCritere) => ({
          id: sousCritere.evaluation.id,
          note: sousCritere.evaluation.note,
          commentaire: sousCritere.evaluation.commentaire,
        })),
      })),
      objectifs: autoEvaluation.objectifs.map((objectif) => ({
        id: objectif.evaluation.id,
        note: objectif.evaluation.note,
        commentaire: objectif.evaluation.commentaire,
      })),
    },
  });

  const handleSubmitCriteres = async (e: FormEvent) => {
    e.preventDefault();
    const isValid = await form.trigger("criteres", {
      shouldFocus: true,
    });
    if (!isValid) return;

    setEtape("objectifs");
    window.scrollTo(0, 0);
  };

  const handleSubmit =
    etape === "criteres"
      ? handleSubmitCriteres
      : form.handleSubmit(enregistrerBrouillon);

  return (
    <main className="py-6 pt-0">
      <FormProvider {...form}>
        <div className="min-h-[60vh] relative">
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
                    <Icone className="h-5 w-5" icone={InformationPleineIcon} />{" "}
                    Cette fiche d'évaluation a déjà été soumise.
                  </span>
                ) : null}
                {etape === "criteres" && (
                  <>
                    {!autoEvaluation.readOnly && (
                      <BoutonEnregistrerBrouillon formId={formId} />
                    )}
                    <Bouton
                      form={formId}
                      iconRight={
                        <Icone
                          className="text-current"
                          icone={ArrowLine1Icon}
                        />
                      }
                      label="Objectifs"
                      type="submit"
                    />
                  </>
                )}
                {etape === "objectifs" && (
                  <>
                    <Bouton
                      iconLeft={
                        <Icone
                          className="text-current"
                          icone={ArrowLine3Icon}
                        />
                      }
                      label="Critères"
                      onClick={() => setEtape("criteres")}
                      variant="secondary"
                    />
                    {!autoEvaluation.readOnly && (
                      <>
                        <BoutonEnregistrerBrouillon formId={formId} />
                        <BoutonSoumettreAutoEvaluation />
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <form
            className="bg-white mx-auto w-full max-w-4xl"
            id={formId}
            onSubmit={handleSubmit}
          >
            <header className="p-4 bg-dsfr-blue-france-925 border-b-2 border-black">
              <span className="font-bold text-sm">Mon auto-évaluation</span>
            </header>

            {etape === "criteres" && <EtapeCriteres />}
            {etape === "objectifs" && <EtapeObjectifs />}
          </form>
        </div>
      </FormProvider>
    </main>
  );
};
