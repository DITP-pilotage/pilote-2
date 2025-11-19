import { $Enums } from "@prisma/client";
import { TableauEvaluationRow } from "@/components/Evaluation/TableauEvaluation";
import { clsxm } from "@/utils/clsxm";
import { BoutonAfficherFicheCadrage } from "@/components/Evaluation/BoutonAfficherFicheCadrage";
import { BoutonTraitementEvaluation } from "@/components/Evaluation/BoutonTraitementEvaluation";
import { LigneEtapeEvaluation } from "@/components/Evaluation/LigneEtapeEvaluation";
import { useGetCritere } from "@/components/Evaluation/context";

export const CelluleEvaluation = ({
  ligne,
  currentGrouping,
  onAutosave,
}: {
  ligne: TableauEvaluationRow;
  currentGrouping: string;
  onAutosave?: () => void;
}) => {
  const getCritere = useGetCritere();
  const commentaireName =
    ligne.type === "objectif"
      ? (`fichesEvaluation.${ligne.ficheEvaluationId}.objectifs.${ligne.id}.commentaire` as const)
      : (`fichesEvaluation.${ligne.ficheEvaluationId}.criteres.${ligne.id}.commentaire` as const);
  const noteName =
    ligne.type === "objectif"
      ? (`fichesEvaluation.${ligne.ficheEvaluationId}.objectifs.${ligne.id}.note` as const)
      : (`fichesEvaluation.${ligne.ficheEvaluationId}.criteres.${ligne.id}.note` as const);

  return (
    <div className="space-y-4">
      {(ligne.type === "objectif" || currentGrouping !== "critereId") && (
        <div className="bg-gray-100 pb-2 border-b border-gray-200 -mx-4 px-4 pt-2 flex items-center justify-between gap-2 !mb-0">
          <div className="flex items-center gap-2">
            <span
              className={clsxm(
                "text-xs px-2 py-1.5 rounded-md capitalize font-medium",
                {
                  "bg-blue-100 text-blue-600": ligne.type === "critere",
                  "bg-green-100 text-green-600": ligne.type === "objectif",
                },
              )}
            >
              {ligne.type}
            </span>
            {ligne.libelle}
          </div>
          <div className="flex items-center gap-4">
            <BoutonAfficherFicheCadrage
              critereOuObjectif={
                ligne.type === "objectif"
                  ? { type: "objectif", objectif: ligne }
                  : {
                      type: "critere",
                      critere: getCritere(ligne.id),
                    }
              }
            />
            <BoutonTraitementEvaluation
              dateTraitement={ligne.evaluations[0]?.dateTraitement ?? null}
              disabled={
                ligne.evaluations[0]?.evaluation.note == null ||
                ligne.rattachement.readOnly
              }
              evaluationId={ligne.evaluations[0]?.evaluation.id}
              typeEvaluation={
                ligne.type === "objectif" ? "OBJECTIF" : "MANIERE_DE_SERVIR"
              }
            />
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {ligne.evaluations.map((evalItem, index) => {
          const isEditable = index === 0 && !ligne.rattachement.readOnly;

          if (evalItem.etape === $Enums.etape_evaluation_enum.INSTRUCTION) {
            return (
              <LigneEtapeEvaluation
                commentaire={evalItem.evaluation.commentaire}
                commentaireLabel="Commentaire d'instruction"
                commentaireName={commentaireName}
                isEditable={isEditable}
                key={evalItem.etape}
                note={evalItem.evaluation.note}
                noteLabel="Note d'instruction"
                noteName={noteName}
                onAutosave={onAutosave}
              />
            );
          } else if (
            evalItem.etape === $Enums.etape_evaluation_enum.CONSOLIDATION
          ) {
            return (
              <LigneEtapeEvaluation
                commentaire={evalItem.evaluation.commentaire}
                commentaireLabel="Commentaire de consolidation"
                commentaireName={commentaireName}
                isEditable={isEditable}
                key={evalItem.etape}
                note={evalItem.evaluation.note}
                noteLabel="Note de consolidation"
                noteName={noteName}
                onAutosave={onAutosave}
              />
            );
          } else if (
            evalItem.etape === $Enums.etape_evaluation_enum.AUTO_EVALUATION
          ) {
            return (
              <LigneEtapeEvaluation
                commentaire={evalItem.evaluation.commentaire}
                commentaireLabel="Commentaire de l'auto évalué"
                commentaireName={commentaireName}
                isEditable={false}
                key={evalItem.etape}
                note={evalItem.evaluation.note}
                noteLabel="Note auto-évaluation"
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
