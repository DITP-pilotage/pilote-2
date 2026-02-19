import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { Albert } from "@/server/albert/Albert";
import { buildChatSystemPrompt } from "@/server/albert/systemPrompt";
import { createGetSyntheseTerritoireTool } from "@/server/albert/tools/getSyntheseTerritoire";
import { getContainer } from "@/server/dependances";

export const albertRouter = créerRouteurTRPC({
  chat: procédureProtégée
    .input(
      z.object({
        prompt: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const territoiresAccessibles =
        ctx.session.habilitations.lecture.territoires;

      const container = getContainer("chantiers");
      const getSyntheseTerritoireQuery = container.resolve(
        "getSyntheseTerritoireQuery",
      );

      const systemPrompt = buildChatSystemPrompt({ territoiresAccessibles });
      const getSyntheseTerritoire = createGetSyntheseTerritoireTool({
        territoiresAccessibles,
        getSyntheseTerritoireQuery,
      });

      return Albert.generateText({
        prompt: input.prompt,
        systemPrompt,
        userId: ctx.session.user.id,
        tools: {
          get_synthese_territoire: getSyntheseTerritoire,
        },
      });
    }),
});
