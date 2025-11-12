import { useFieldArray } from "react-hook-form";
import { useFormEvaluation } from "@/components/PageAutoEvaluation/form";
import { CommentaireTextareaAutoEvaluation } from "@/components/PageAutoEvaluation/CommentaireTextareaAutoEvaluation";
import { InputNoteAutoEvaluation } from "@/components/PageAutoEvaluation/InputNoteAutoEvaluation";
import { BoutonEnSavoirPlus } from "@/components/PageAutoEvaluation/BoutonEnSavoirPlus";
import { pageAutoEvaluationManieresDeServir } from "@/components/PageAutoEvaluation/manieres-de-servir/PageAutoEvaluationManieresDeServirServerSideContext";

export const EtapeCriteres = () => {
  const { autoEvaluation } =
    pageAutoEvaluationManieresDeServir.useServerSidePropsContext();
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
              <InputNoteAutoEvaluation
                name={noteName}
                readOnly={autoEvaluation.readOnly}
              />
            </header>
            <div className="py-4 px-6 flex flex-col bg-dsfr-grey-925/30 ">
              <CommentaireTextareaAutoEvaluation
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
