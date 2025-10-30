import { useFieldArray } from "react-hook-form";
import { useFormEvaluation } from "@/components/PageEvaluation/form";
import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";
import { CommentaireTextareaAutoEvaluation } from "@/components/PageEvaluation/CommentaireTextareaAutoEvaluation";
import { InputNoteAutoEvaluation } from "@/components/PageEvaluation/InputNoteAutoEvaluation";
import { BoutonEnSavoirPlus } from "@/components/PageEvaluation/BoutonEnSavoirPlus";

export const EtapeCriteres = () => {
  const { autoEvaluation } = pageEvaluation.useServerSidePropsContext();
  const form = useFormEvaluation();
  const { fields } = useFieldArray({ control: form.control, name: "criteres" });

  return (
    <div>
      {fields.map((fieldCritere, index) => {
        const critere = autoEvaluation.criteres[index];
        const noteName = `criteres.${index}.note` as const;
        const commentaireName = `criteres.${index}.commentaire` as const;

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
              <InputNoteAutoEvaluation name={noteName} />
            </header>
            <div className="py-4 px-6 flex flex-col bg-dsfr-grey-925/30 ">
              <CommentaireTextareaAutoEvaluation name={commentaireName} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
