import { generateText, Output, tool } from "ai";
import { z } from "zod";
import {
  composeDashboardInputSchema,
  type ComposeDashboardOutput,
} from "@/server/albert/tools/composeDashboard";
import { buildDashboardSystemPrompt } from "@/server/albert/subagents/dashboardSystemPrompt";
import { Albert, withOptionalDevTools } from "@/server/albert/Albert";

export const createDashboardInputSchema = z.object({
  task: z
    .string()
    .describe(
      "Description de ce que l'utilisateur veut visualiser, " +
        "incluant le(s) territoire(s), le jalon, et le type d'analyse souhaitée.",
    ),
});

export type CreateDashboardOutput = ComposeDashboardOutput;

const OUTPUT_INSTRUCTIONS = `Le dashboard a été composé et sera affiché visuellement sous forme de widgets dans l'interface.
Ne reproduis JAMAIS de valeurs chiffrées dans ta réponse textuelle (les chiffres sont résolus au rendu côté client).
Tu peux ajouter une phrase courte d'introduction ("Voici le dashboard demandé.") mais pas de commentaire sur les chiffres.
Si l'utilisateur demande à modifier le dashboard, rappelle create_dashboard avec une nouvelle description.`;

export function createCreateDashboardTool() {
  const albertProvider = Albert.createProvider();

  return tool({
    description: `Délègue la composition d'un dashboard à un agent spécialisé.
Utilise ce tool quand l'utilisateur demande un dashboard, un cockpit,
un tableau de bord visuel, ou d'afficher les indicateurs d'un chantier.
Décris précisément ce que l'utilisateur veut visualiser.`,
    inputSchema: createDashboardInputSchema,
    execute: async ({ task }, { abortSignal }) => {
      const result = await generateText({
        model: withOptionalDevTools(albertProvider.chat("openweight-large")),
        system: buildDashboardSystemPrompt(),
        prompt: task,
        output: Output.object({ schema: composeDashboardInputSchema }),
        abortSignal,
      });

      if (!result.output) {
        throw new Error("Le subagent n'a pas pu composer de dashboard.");
      }

      return {
        titre: result.output.titre,
        containers: result.output.containers,
        _output_instructions: OUTPUT_INSTRUCTIONS,
      };
    },
  });
}
