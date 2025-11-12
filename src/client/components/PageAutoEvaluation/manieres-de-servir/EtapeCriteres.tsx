import { useFieldArray } from "react-hook-form";
import { CommentaireTextareaAutoEvaluation } from "@/components/PageAutoEvaluation/CommentaireTextareaAutoEvaluation";
import { InputNoteAutoEvaluation } from "@/components/PageAutoEvaluation/InputNoteAutoEvaluation";
import { BoutonEnSavoirPlus } from "@/components/PageAutoEvaluation/BoutonEnSavoirPlus";
import { pageAutoEvaluationManieresDeServir } from "@/components/PageAutoEvaluation/manieres-de-servir/PageAutoEvaluationManieresDeServirServerSideContext";
import { useFormEvaluationCriteres } from "@/components/PageAutoEvaluation/manieres-de-servir/form";

export const EtapeCriteres = () => {
  const { autoEvaluation } =
    pageAutoEvaluationManieresDeServir.useServerSidePropsContext();
  const form = useFormEvaluationCriteres();
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
              <InputNoteAutoEvaluation
                control={form.control}
                name={noteName}
                readOnly={autoEvaluation.readOnly}
              />
            </header>
            <div className="py-4 px-6 flex flex-col bg-dsfr-grey-925/30 ">
              <CommentaireTextareaAutoEvaluation
                control={form.control}
                defaultOpen={!!fieldCritere.commentaire}
                name={commentaireName}
                readOnly={autoEvaluation.readOnly}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
