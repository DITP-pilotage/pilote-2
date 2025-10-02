import { useFieldArray } from "react-hook-form";
import { useFormEvaluation } from "@/components/PageEvaluation/form";
import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";
import { Commentaire } from "@/components/PageEvaluation/Commentaire";
import { InputNote } from "@/components/PageEvaluation/InputNote";

export function EtapeObjectifs() {
  const { autoEvaluation } = pageEvaluation.useServerSidePropsContext();
  const form = useFormEvaluation();
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
              <header className="text-primary font-bold">{objectif.nom}</header>
              <InputNote name={noteName} />
            </div>
            <div className="py-4 px-6 flex flex-col bg-dsfr-grey-925/30 ">
              <Commentaire name={commentaireName} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
