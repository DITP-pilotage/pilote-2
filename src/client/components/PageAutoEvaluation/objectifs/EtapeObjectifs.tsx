import { useFieldArray } from "react-hook-form";
import { useCallback } from "react";
import { pageAutoEvaluationObjectifs } from "@/components/PageAutoEvaluation/objectifs/PageAutoEvaluationObjectifsServerSideContext";
import { CommentaireTextareaAutoEvaluation } from "@/components/PageAutoEvaluation/CommentaireTextareaAutoEvaluation";
import { InputNoteAutoEvaluation } from "@/components/PageAutoEvaluation/InputNoteAutoEvaluation";
import { BoutonEnSavoirPlus } from "@/components/PageAutoEvaluation/BoutonEnSavoirPlus";
import { useFormEvaluationObjectifs } from "@/components/PageAutoEvaluation/objectifs/form";
import { useEnregistrerBrouillonObjectifs } from "@/components/PageAutoEvaluation/objectifs/useEnregistrerBrouillonObjectifs";
import { AnnexeTextareaAutoEvaluation } from "@/components/PageAutoEvaluation/AnnexeTextareaAutoEvaluation";

export function EtapeObjectifs() {
  const { autoEvaluation } =
    pageAutoEvaluationObjectifs.useServerSidePropsContext();
  const form = useFormEvaluationObjectifs();
  const { fields } = useFieldArray({
    control: form.control,
    name: "objectifs",
  });
  const readOnly = autoEvaluation.readOnly || autoEvaluation.objectifsValides;
  const enregistrerBrouillon = useEnregistrerBrouillonObjectifs({
    showToast: false,
  });

  const handleAutosave = useCallback(async () => {
    const isValid = await form.trigger();
    if (isValid) {
      await form.handleSubmit(enregistrerBrouillon)();
    }
  }, [form, enregistrerBrouillon]);

  return (
    <div className="divide-y divide-gray-100">
      {fields.map((fieldObjectif, index) => {
        const objectif = autoEvaluation.objectifs[index];
        const noteName = `objectifs.${index}.note` as const;
        const commentaireName = `objectifs.${index}.commentaire` as const;
        const annexeName = `objectifs.${index}.annexe` as const;

        return (
          <div key={objectif.id}>
            <div className="p-4 flex items-center justify-between pr-6">
              <header className="flex items-center gap-2">
                <span className="text-primary font-bold">
                  {objectif.libelle}
                </span>
                <BoutonEnSavoirPlus
                  critereOuObjectif={{ type: "objectif", objectif }}
                />
              </header>
              <InputNoteAutoEvaluation
                control={form.control}
                name={noteName}
                onAutosave={handleAutosave}
                readOnly={readOnly}
              />
            </div>
            <div className="py-4 px-6 flex flex-col bg-dsfr-grey-925/30 ">
              <CommentaireTextareaAutoEvaluation
                control={form.control}
                defaultOpen={!!fieldObjectif.commentaire}
                name={commentaireName}
                onAutosave={handleAutosave}
                readOnly={readOnly}
              />
            </div>
            <div className="py-4 px-6 flex flex-col bg-dsfr-blue-france-850/30 ">
              <AnnexeTextareaAutoEvaluation
                control={form.control}
                name={annexeName}
                readOnly={readOnly}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
