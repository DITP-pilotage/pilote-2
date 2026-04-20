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
        <li className="!text-warning">
          <b>Phase d'appréciation</b> : {appreciationRequierentAttention}{" "}
          formulaire(s) non transmis à ce jour
        </li>
      )}
      {appreciationCompletes > 0 && (
        <li className="!text-primary">
          <b>Phase d'appréciation</b> : {appreciationCompletes} formulaire(s)
          transmis et en attente d'être instruit(s)
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
          <b>Phase d'instruction</b> : {instructionEnCours} formulaire(s) en
          instruction
        </li>
      )}
    </ul>
  );
};
