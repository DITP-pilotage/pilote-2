import { $Enums } from "@prisma/client";
import { Row } from "@tanstack/react-table";
import { useFormState } from "react-hook-form";
import { TableauEvaluationRow } from "@/components/Evaluation/TableauEvaluation";
import { BoutonAfficherFicheCadrage } from "@/components/Evaluation/BoutonAfficherFicheCadrage";
import { LigneEtapeEvaluation } from "@/components/Evaluation/LigneEtapeEvaluation";
import { useGetCritere } from "@/components/Evaluation/CriteresProvider";
import { useFormulaireEvaluation } from "@/components/Evaluation/form";
import { useHandleAutosave } from "@/components/Evaluation/AutosaveProvider";
import { useSetCritereOuObjectif } from "@/components/Evaluation/LayoutFicheCadrage";
import { BoutonTraitementEvaluation } from "@/components/Evaluation/BoutonTraitementEvaluation";

export const CelluleEvaluation = ({
  row,
}: {
  row: Row<TableauEvaluationRow>;
}) => {
  const ligne = row.original;
  const onAutosave = useHandleAutosave();
  const getCritere = useGetCritere();
  const setCritereOuObjectif = useSetCritereOuObjectif();
  const commentaireName =
    ligne.type === "objectif"
      ? (`fichesEvaluation.${ligne.ficheEvaluationId}.objectifs.${ligne.id}.commentaire` as const)
      : (`fichesEvaluation.${ligne.ficheEvaluationId}.criteres.${ligne.id}.commentaire` as const);
  const noteName =
    ligne.type === "objectif"
      ? (`fichesEvaluation.${ligne.ficheEvaluationId}.objectifs.${ligne.id}.note` as const)
      : (`fichesEvaluation.${ligne.ficheEvaluationId}.criteres.${ligne.id}.note` as const);
  const form = useFormulaireEvaluation();
  const note = form.watch(noteName);

  // Nécessaire pour lire l'état mis à jour des champs
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  useFormState().isValid;
  const commentaireError = form.getFieldState(commentaireName).invalid;
  const noteError = form.getFieldState(noteName).invalid;
  const traitementDisabled = commentaireError || noteError;

  const critereOuObjectif =
    ligne.type === "objectif"
      ? ({ type: "objectif", objectif: ligne } as const)
      : ({
          type: "critere",
          critere: getCritere(ligne.id),
        } as const);

  const afficherFicheCadrage = () => setCritereOuObjectif(critereOuObjectif);

  return (
    <div className="space-y-4">
      <div className="bg-dsfr-blue-france-925 pb-2 border-b border-gray-200 -mx-4 p-4 flex justify-between gap-2 !mb-0 min-h-[80px]">
        <div className="text-primary font-bold text-sm line-clamp-2">
          <span className="capitalize">{ligne.type}</span> - {ligne.libelle}
        </div>
        <BoutonAfficherFicheCadrage critereOuObjectif={critereOuObjectif} />
      </div>

      <div className="divide-y divide-gray-200">
        {ligne.evaluations.map((evalItem, index) => {
          const isEtapeCouranteEvaluation = index === 0;
          const mode = !isEtapeCouranteEvaluation
            ? "lecture-seule"
            : ligne.rattachement.readOnly
              ? "bloque"
              : "editable";

          const boutonTraitement = isEtapeCouranteEvaluation ? (
            <BoutonTraitementEvaluation
              dateTraitement={ligne.evaluations[0]?.dateTraitement ?? null}
              disabled={
                note == null ||
                ligne.rattachement.readOnly ||
                traitementDisabled
              }
              evaluationId={ligne.evaluations[0]?.evaluation.id}
              typeEvaluation={
                ligne.type === "objectif" ? "OBJECTIF" : "MANIERE_DE_SERVIR"
              }
            />
          ) : null;

          if (evalItem.etape === $Enums.etape_evaluation_enum.INSTRUCTION) {
            return (
              <LigneEtapeEvaluation
                commentaire={evalItem.evaluation.commentaire}
                commentaireLabel="Instruction"
                commentaireName={commentaireName}
                key={evalItem.etape}
                mode={mode}
                note={evalItem.evaluation.note}
                noteName={noteName}
                onAfficherFicheCadrage={afficherFicheCadrage}
                onAutosave={onAutosave}
                traitement={boutonTraitement}
              />
            );
          } else if (
            evalItem.etape === $Enums.etape_evaluation_enum.CONSOLIDATION
          ) {
            return (
              <LigneEtapeEvaluation
                commentaire={evalItem.evaluation.commentaire}
                commentaireLabel="Appréciation"
                commentaireName={commentaireName}
                key={evalItem.etape}
                mode={mode}
                note={evalItem.evaluation.note}
                noteName={noteName}
                onAfficherFicheCadrage={afficherFicheCadrage}
                onAutosave={onAutosave}
                traitement={boutonTraitement}
              />
            );
          } else if (
            evalItem.etape === $Enums.etape_evaluation_enum.AUTO_EVALUATION
          ) {
            return (
              <LigneEtapeEvaluation
                annexe={evalItem.evaluation.annexe}
                commentaire={evalItem.evaluation.commentaire}
                commentaireLabel="Auto-évaluation"
                commentaireName={commentaireName}
                key={evalItem.etape}
                mode="lecture-seule"
                note={evalItem.evaluation.note}
                noteName={noteName}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};
