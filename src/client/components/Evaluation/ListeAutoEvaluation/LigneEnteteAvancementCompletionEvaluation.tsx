export const LigneEnteteAvancementCompletionEvaluation = ({
  avancementCompletion: { nombreNotes, nombreTotal },
  estValide,
  categorie,
  texteCibleCompletion,
}: {
  avancementCompletion: { nombreNotes: number; nombreTotal: number };
  estValide: boolean;
  categorie: string;
  texteCibleCompletion: "axe" | "objectif";
}) => {
  if (estValide) {
    return (
      <li className="!text-primary">
        <b>{categorie}</b> : votre auto-évaluation a été transmise
      </li>
    );
  }

  return (
    <li className="!text-pilote-yellow">
      <b>{categorie}</b> : 
      {nombreNotes === nombreTotal
        ? "votre auto-évaluation est complète et en attente d'être transmise"
        : `vous avez auto-évalué ${nombreNotes} ${texteCibleCompletion}(s) sur ${nombreTotal}`}
    </li>
  );
};
