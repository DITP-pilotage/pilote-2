// Albert tourne sur un modèle à raisonnement. Les décisions de l'import sont
// simples et validées par le code : un raisonnement court suffit, et divise par
// deux la durée d'un appel (17 s contre 34 s mesurées sur un appel type).
export const ALBERT_IMPORT_OPTIONS = { openai: { reasoningEffort: 'low' } }
