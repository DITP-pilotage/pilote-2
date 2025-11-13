import { useFieldArray } from "react-hook-form";
import { useCallback } from "react";
import { CommentaireTextareaAutoEvaluation } from "@/components/PageAutoEvaluation/CommentaireTextareaAutoEvaluation";
import { InputNoteAutoEvaluation } from "@/components/PageAutoEvaluation/InputNoteAutoEvaluation";
import { BoutonEnSavoirPlus } from "@/components/PageAutoEvaluation/BoutonEnSavoirPlus";
import { pageAutoEvaluationManieresDeServir } from "@/components/PageAutoEvaluation/manieres-de-servir/PageAutoEvaluationManieresDeServirServerSideContext";
import { useFormEvaluationCriteres } from "@/components/PageAutoEvaluation/manieres-de-servir/form";
import { useEnregistrerBrouillonCriteres } from "@/components/PageAutoEvaluation/manieres-de-servir/useEnregistrerBrouillonCriteres";
import { AnnexeTextareaAutoEvaluation } from "@/components/PageAutoEvaluation/AnnexeTextareaAutoEvaluation";

export const EtapeCriteres = () => {
  const { autoEvaluation } =
    pageAutoEvaluationManieresDeServir.useServerSidePropsContext();
  const form = useFormEvaluationCriteres();
  const { fields } = useFieldArray({ control: form.control, name: "criteres" });
  const readOnly = autoEvaluation.readOnly || autoEvaluation.criteresValides;
  const enregistrerBrouillon = useEnregistrerBrouillonCriteres({
    showToast: false,
  });

  const handleAutosave = useCallback(async () => {
    const isValid = await form.trigger();
    if (isValid) {
      await form.handleSubmit(enregistrerBrouillon)();
    }
  }, [form, enregistrerBrouillon]);

  return (
    <div>
      {fields.map((fieldCritere, index) => {
        const critere = autoEvaluation.criteres[index];
        const noteName = `criteres.${index}.note` as const;
        const commentaireName = `criteres.${index}.commentaire` as const;
        const annexeName = `criteres.${index}.annexe` as const;

        return (
          <div key={critere.id}>
            <header className="p-4 flex items-center justify-between pr-6">
              <div className="flex items-center">
                {critere.libelle}
                <BoutonEnSavoirPlus
                  critereOuObjectif={{
                    type: "critere",
                    critere,
                  }}
                />
              </div>
              <InputNoteAutoEvaluation
                control={form.control}
                name={noteName}
                onAutosave={handleAutosave}
                readOnly={readOnly}
              />
            </header>
            <div className="py-4 px-6 flex flex-col bg-dsfr-grey-925/30 ">
              <CommentaireTextareaAutoEvaluation
                control={form.control}
                defaultOpen={!!fieldCritere.commentaire}
                name={commentaireName}
                onAutosave={handleAutosave}
                readOnly={readOnly}
              />
            </div>
            <div className="py-4 px-6 flex flex-col bg-dsfr-grey-925/30 ">
              <AnnexeTextareaAutoEvaluation
                control={form.control}
                defaultOpen={form.getValues(annexeName) !== ""}
                name={annexeName}
                readOnly={readOnly}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
