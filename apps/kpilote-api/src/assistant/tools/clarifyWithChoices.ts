import { type ToolDefinition } from '@/assistant/tools/toolDefinition'

export const clarifyWithChoices: ToolDefinition<'clarify_with_choices'> = {
  description: `Affiche à l'utilisateur un encart de choix : une question et 2 à 4 options concrètes, réalisables telles quelles, chacune formulée comme la demande qu'il aurait pu écrire.
- \`question\` porte toute l'explication : n'écris pas de texte avant l'appel.
- Appelle-le seul : aucun outil de données dans le même tour, ni avant ni après.
- Après l'appel, termine ta réponse par cette seule phrase : « Choisissez une option pour continuer. »`,
  execute: (input) => Promise.resolve(input),
}
