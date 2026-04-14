import { generateText, stepCountIs, tool, type ToolSet } from "ai";
import { z } from "zod";
import type { ComposeDashboardOutput } from "@/server/albert/tools/composeDashboard";
import { buildDashboardSystemPrompt } from "@/server/albert/subagents/dashboardSystemPrompt";
import { Albert } from "@/server/albert/Albert";

export const createDashboardInputSchema = z.object({
  task: z
    .string()
    .describe(
      "Description de ce que l'utilisateur veut visualiser, " +
        "incluant le(s) territoire(s), le jalon, et le type d'analyse souhaitée.",
    ),
});

export type CreateDashboardOutput = ComposeDashboardOutput;

type CreateDashboardToolDeps = {
  subagentTools: ToolSet;
  userId: string;
  chatId: string;
};

function extractDashboardOutput(
  steps: { toolCalls: Array<{ toolName: string; result?: unknown }> }[],
): CreateDashboardOutput {
  console.log(steps.flatMap((step) => step.toolCalls));
  const composeDashboardCall = steps
    .flatMap((step) => step.toolCalls)
    .findLast((call) => call.toolName === "compose_dashboard");

  if (!composeDashboardCall?.result) {
    throw new Error("Le subagent n'a pas pu composer de dashboard.");
  }

  return composeDashboardCall.result as CreateDashboardOutput;
}

export function createCreateDashboardTool({
  subagentTools,
  userId,
  chatId,
}: CreateDashboardToolDeps) {
  return tool({
    description: `Délègue la composition d'un dashboard à un agent spécialisé.
Utilise ce tool quand l'utilisateur demande un dashboard, un cockpit,
un tableau de bord visuel, ou d'afficher les indicateurs d'un chantier.
Décris précisément ce que l'utilisateur veut visualiser.`,
    inputSchema: createDashboardInputSchema,
    execute: async ({ task }, { abortSignal }) => {
      try {
        console.log("---------------");
        console.log("Début de la génération...");
        const result = await Albert.generateText({
          systemPrompt: buildDashboardSystemPrompt(),
          prompt: task,
          tools: subagentTools,
          abortSignal,
          userId,
          chatId,
        });

        // console.log(result.);

        return extractDashboardOutput(result.steps);
      } catch (e) {
        console.log("--------------------------------");
        console.log(e);
        console.log("--------------------------------");

        throw e;
      }
    },
  });
}
