import { FicheEvaluation } from "@/server/evaluation/domain/FicheEvaluation";

export const LignesEnteteAvancementCompletionAppreciation = ({
  autoEvaluation,
  consolidation,
  instruction,
}: {
  autoEvaluation: FicheEvaluation[];
  consolidation: FicheEvaluation[];
  instruction: FicheEvaluation[];
}) => {
  const appreciationRequierentAttention = consolidation.filter(
    (fiche) => !fiche.isObjectifsValides || !fiche.isCriteresValides,
  ).length;
  const appreciationCompletes = consolidation.filter(
    (fiche) => fiche.isObjectifsValides && fiche.isCriteresValides,
  ).length;
  const autoEvaluationEnCours = autoEvaluation.length;
  const instructionEnCours = instruction.length;

  return (
    <ul className="list-disc list-inside mt-4 mb-2">
      {appreciationRequierentAttention > 0 && (
        <li className="!text-pilote-yellow">
          <b>Phase d'appréciation</b> : {appreciationRequierentAttention}{" "}
          formulaire(s){" "}
          {appreciationRequierentAttention === 1 ? "requiert" : "requièrent"}{" "}
          votre attention
        </li>
      )}
      {appreciationCompletes > 0 && (
        <li className="!text-primary">
          <b>Phase d'appréciation</b> : {appreciationCompletes} formulaire(s){" "}
          {appreciationCompletes === 1 ? "est complété" : "sont complétés"}{" "}
          et/ou en train d'être vérifié
          {appreciationCompletes === 1 ? "" : "s"} par la DITP
        </li>
      )}
      {autoEvaluationEnCours > 0 && (
        <li className="!text-grey-200">
          <b>Phase d'auto-évaluation</b> : {autoEvaluationEnCours} formulaire(s){" "}
          {autoEvaluationEnCours === 1 ? "est" : "sont"} en cours
          d'auto-évaluation
        </li>
      )}
      {instructionEnCours > 0 && (
        <li className="!text-grey-200">
          <b>Phase d'instruction</b> : {instructionEnCours} formulaire(s){" "}
          {instructionEnCours === 1 ? "est passé" : "sont passés"} en
          instruction
        </li>
      )}
    </ul>
  );
};
