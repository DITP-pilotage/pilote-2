import { useFieldArray } from "react-hook-form";
import { pageAutoEvaluationObjectifs } from "@/components/PageAutoEvaluation/objectifs/PageAutoEvaluationObjectifsServerSideContext";
import { CommentaireTextareaAutoEvaluation } from "@/components/PageAutoEvaluation/CommentaireTextareaAutoEvaluation";
import { InputNoteAutoEvaluation } from "@/components/PageAutoEvaluation/InputNoteAutoEvaluation";
import { BoutonEnSavoirPlus } from "@/components/PageAutoEvaluation/BoutonEnSavoirPlus";
import { useFormEvaluationObjectifs } from "@/components/PageAutoEvaluation/objectifs/form";

export function EtapeObjectifs() {
  const { autoEvaluation } =
    pageAutoEvaluationObjectifs.useServerSidePropsContext();
  const form = useFormEvaluationObjectifs();
  const { fields } = useFieldArray({
    control: form.control,
    name: "objectifs",
  });
  return (
    <div className="divide-y divide-gray-100">
      {fields.map((fieldObjectif, index) => {
        const objectif = autoEvaluation.objectifs[index];
        const noteName = `objectifs.${index}.note` as const;
        const commentaireName = `objectifs.${index}.commentaire` as const;

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
                readOnly={autoEvaluation.readOnly}
              />
            </div>
            <div className="py-4 px-6 flex flex-col bg-dsfr-grey-925/30 ">
              <CommentaireTextareaAutoEvaluation
                control={form.control}
                defaultOpen={!!fieldObjectif.commentaire}
                name={commentaireName}
                readOnly={autoEvaluation.readOnly}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
