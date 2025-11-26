import { FicheEvaluation } from "@/server/evaluation/domain/FicheEvaluation";

const compterAppreciationAvecAttention = (appreciation: FicheEvaluation[]) =>
  appreciation.reduce(
    (count, fiche) =>
      count +
      (!fiche.isObjectifsValides && !fiche.readOnly ? 1 : 0) +
      (!fiche.isCriteresValides && !fiche.readOnly ? 1 : 0),
    0,
  );

const compterAppreciationCompletes = (appreciation: FicheEvaluation[]) =>
  appreciation.reduce(
    (count, fiche) =>
      count +
      (fiche.isObjectifsValides || fiche.readOnly ? 1 : 0) +
      (fiche.isCriteresValides || fiche.readOnly ? 1 : 0),
    0,
  );

export const LignesEnteteAvancementCompletionAppreciation = ({
  autoEvaluation,
  appreciation,
  instruction,
}: {
  autoEvaluation: FicheEvaluation[];
  appreciation: FicheEvaluation[];
  instruction: FicheEvaluation[];
}) => {
  const appreciationRequierentAttention =
    compterAppreciationAvecAttention(appreciation);
  const appreciationCompletes = compterAppreciationCompletes(appreciation);
  const autoEvaluationEnCours = autoEvaluation.length * 2;
  const instructionEnCours = instruction.length * 2;

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
