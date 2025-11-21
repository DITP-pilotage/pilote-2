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
    <div>
      {fields.map((fieldObjectif, index) => {
        const objectif = autoEvaluation.objectifs[index];
        const noteName = `objectifs.${index}.note` as const;
        const commentaireName = `objectifs.${index}.commentaire` as const;
        const annexeName = `objectifs.${index}.annexe` as const;

        return (
          <div key={objectif.id}>
            <header className="p-4 flex items-center justify-between pr-6 bg-dsfr-blue-france-925 border-t-1 border-dsfr-blue-france-sun-113">
              <span className="font-semibold text-dsfr-blue-france-sun-113">
                {objectif.libelle}
              </span>
              <BoutonEnSavoirPlus
                critereOuObjectif={{
                    type: "objectif",
                    objectif: {
                      ...objectif,
                      ficheEvaluationId: autoEvaluation.ficheEvaluationId,
                    },
                  }}
              />
            </header>
            <div className="flex bg-dsfr-grey-925/30">
              <div className="py-4 px-6 flex flex-col flex-1">
                <CommentaireTextareaAutoEvaluation
                  control={form.control}
                  name={commentaireName}
                  onAutosave={handleAutosave}
                  readOnly={readOnly}
                />
                <AnnexeTextareaAutoEvaluation
                  control={form.control}
                  name={annexeName}
                  onAutosave={handleAutosave}
                  readOnly={readOnly}
                />
              </div>
              <div className="py-4 px-6 flex items-start justify-center border-l-1 border-black">
                <InputNoteAutoEvaluation
                  control={form.control}
                  label="Note"
                  name={noteName}
                  onAutosave={handleAutosave}
                  readOnly={readOnly}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
