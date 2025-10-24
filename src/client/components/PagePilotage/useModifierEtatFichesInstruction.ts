export const useModifierEtatFichesInstruction = () => {
  return {
    modifierEtat: (ficheEvaluationIds: string[], readOnly: boolean) => {
      console.log("Modifier état fiches instruction:", ficheEvaluationIds, "readOnly:", readOnly);
      return Promise.resolve();
    },
  };
};
