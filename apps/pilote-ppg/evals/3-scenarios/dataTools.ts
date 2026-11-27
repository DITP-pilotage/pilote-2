import type { Tool } from "ai";
import { getContainer } from "@/server/dependances";
import { classerChantiers } from "@/server/albert/tools/getChantiers";
import {
  collecterChantiers,
  type CollecteChantiersInput,
} from "@/server/albert/tools/collecteChantiers";
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
    getIndicateurs: container.resolve("createGetChantierIndicateursTool")({
      chantiersAccessibles,
    }),
    getChantierCommentaires: container.resolve(
      "createGetChantierCommentairesTool",
    )({ territoiresAccessibles, chantiersAccessibles }),
    /**
     * Les chantiers tels que les lit `get_chantiers`, synthèse comprise : la
     * collecte partagée avec les encarts, classée comme l'outil sans tri ni
     * limite. La sortie de l'outil ne porte plus la synthèse, que la fiche de
     * vérité doit pourtant connaître.
     */
    collecterChantiers: async (input: CollecteChantiersInput) =>
      classerChantiers({
        sortie: await collecterChantiers({
          input,
          getChantiersQuery: container.resolve("getChantiersQuery"),
          territoireResolver: container.resolve("territoireResolver"),
          territoiresAccessibles,
          chantiersAccessibles,
        }),
      }),
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
