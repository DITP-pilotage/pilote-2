import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { Albert } from "@/server/albert/Albert";
import { buildChatSystemPrompt } from "@/server/albert/systemPrompt";
import { createGetSyntheseTerritoireTool } from "@/server/albert/tools/getSyntheseTerritoire";

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

      const systemPrompt = buildChatSystemPrompt({ territoiresAccessibles });
      const getSyntheseTerritoire = createGetSyntheseTerritoireTool({
        territoiresAccessibles,
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
