import type { Tool } from "ai";
import { getContainer } from "@/server/dependances";
import type { EvalUser } from "../world";

/**
 * Les outils de données de l'agent, avec les habilitations d'un profil, hors
 * de tout tour d'agent. Même câblage que `AssistantIA.construireTools` : une
 * fiche de vérité lue autrement ne vérifierait pas ce que l'agent reçoit.
 */
export function createDataTools({ user }: { user: EvalUser }) {
  const container = getContainer("albert");
  const territoiresAccessibles = user.habilitations.lecture.territoires;
  const chantiersAccessibles = user.habilitations.lecture.chantiers;

  return {
    getTauxAvancementTerritoire: container.resolve(
      "createGetTauxAvancementTerritoireTool",
    )({ habilitations: user.habilitations }),
    getChantiers: container.resolve("createGetChantiersTool")({
      territoiresAccessibles,
      chantiersAccessibles,
    }),
    getIndicateurs: container.resolve("createGetChantierIndicateursTool")(),
    getChantierCommentaires: container.resolve(
      "createGetChantierCommentairesTool",
    )({ territoiresAccessibles }),
  };
}

export type DataTools = ReturnType<typeof createDataTools>;

export async function executeTool<TOutput>({
  tool,
  input,
}: {
  tool: Tool;
  input: unknown;
}): Promise<TOutput> {
  if (!tool.execute) {
    throw new Error("Outil sans execute");
  }

  return (await tool.execute(input as never, {
    toolCallId: "fiche-de-verite",
    messages: [],
    abortSignal: undefined,
    context: {},
  })) as TOutput;
}
