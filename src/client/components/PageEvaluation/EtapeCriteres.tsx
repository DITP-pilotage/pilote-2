import { useFieldArray } from "react-hook-form";
import { useFormEvaluation } from "@/components/PageEvaluation/form";
import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";
import { CommentaireTextarea } from "@/components/PageEvaluation/CommentaireTextarea";
import { InputNote } from "@/components/PageEvaluation/InputNote";

export const EtapeCriteres = () => {
  const { autoEvaluation } = pageEvaluation.useServerSidePropsContext();
  const form = useFormEvaluation();
  const { fields } = useFieldArray({ control: form.control, name: "criteres" });

  return (
    <div>
      {fields.map((fieldCritere, index) => {
        const critere = autoEvaluation.criteres[index];
        return (
          <div key={critere.id}>
            <header className="py-6 px-4 text-primary font-bold border-t-1 !border-primary">
              {critere.libelle}
            </header>
            <div className="bg-dsfr-grey-925/30 divide-y divide-gray-200">
              {fieldCritere.sousCriteres.map((subField, j) => {
                const sousCritere = critere.sousCriteres[j];
                const noteInputName =
                  `criteres.${index}.sousCriteres.${j}.note` as const;
                const commentaireInputName =
                  `criteres.${index}.sousCriteres.${j}.commentaire` as const;

                return (
                  <div className="py-6 px-6 flex flex-col" key={sousCritere.id}>
                    <div className="flex items-center">
                      <span className="text-primary grow">
                        {sousCritere.nom}
                      </span>
                      <InputNote name={noteInputName} />{" "}
                    </div>

                    <CommentaireTextarea name={commentaireInputName} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
