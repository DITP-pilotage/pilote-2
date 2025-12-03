import { useFieldArray } from "react-hook-form";
import { useCallback } from "react";
import { CommentaireTextareaAutoEvaluation } from "@/components/PageAutoEvaluation/CommentaireTextareaAutoEvaluation";
import { InputNoteAutoEvaluation } from "@/components/PageAutoEvaluation/InputNoteAutoEvaluation";
import { BoutonAfficherFicheCadrage } from "@/components/PageAutoEvaluation/BoutonAfficherFicheCadrage";
import { pageAutoEvaluationManieresDeServir } from "@/components/PageAutoEvaluation/manieres-de-servir/PageAutoEvaluationManieresDeServirServerSideContext";
import { useFormEvaluationCriteres } from "@/components/PageAutoEvaluation/manieres-de-servir/form";
import { useEnregistrerBrouillonCriteres } from "@/components/PageAutoEvaluation/manieres-de-servir/useEnregistrerBrouillonCriteres";
import { AnnexeTextareaAutoEvaluation } from "@/components/PageAutoEvaluation/AnnexeTextareaAutoEvaluation";
import { useSetCritereOuObjectif } from "@/components/Evaluation/LayoutFicheCadrage";

export const EtapeCriteres = () => {
  const { autoEvaluation } =
    pageAutoEvaluationManieresDeServir.useServerSidePropsContext();
  const form = useFormEvaluationCriteres();
  const { fields } = useFieldArray({ control: form.control, name: "criteres" });
  const readOnly = autoEvaluation.readOnly || autoEvaluation.isCriteresValides;
  const enregistrerBrouillon = useEnregistrerBrouillonCriteres({
    showToast: false,
  });
  const setCritereOuObjectif = useSetCritereOuObjectif();

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

        const afficherFicheCadrage = () => {
          setCritereOuObjectif({
            type: "critere",
            critere,
          });
        };

        return (
          <div key={critere.id}>
            <header className="p-4 flex items-center justify-between pr-6 bg-dsfr-blue-france-925 border-t-1 border-dsfr-blue-france-sun-113">
              <span className="font-semibold text-dsfr-blue-france-sun-113">
                {critere.libelle}
              </span>
              <BoutonAfficherFicheCadrage
                critereOuObjectif={{
                  type: "critere",
                  critere,
                }}
              />
            </header>
            <div className="flex">
              <div className="py-4 px-6 flex flex-col flex-1">
                <CommentaireTextareaAutoEvaluation
                  control={form.control}
                  name={commentaireName}
                  onAutosave={handleAutosave}
                  onFocus={afficherFicheCadrage}
                  readOnly={readOnly}
                />
                <AnnexeTextareaAutoEvaluation
                  control={form.control}
                  name={annexeName}
                  onAutosave={handleAutosave}
                  onFocus={afficherFicheCadrage}
                  readOnly={readOnly}
                />
              </div>
              <div className="py-4 px-6 flex items-start justify-center border-l-1 border-black">
                <InputNoteAutoEvaluation
                  control={form.control}
                  name={noteName}
                  onAutosave={handleAutosave}
                  onFocus={afficherFicheCadrage}
                  readOnly={readOnly}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
