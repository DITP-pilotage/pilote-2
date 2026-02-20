import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { Albert } from "@/server/albert/Albert";
import { buildChatSystemPrompt } from "@/server/albert/systemPrompt";
import { getContainer } from "@/server/dependances";
import { RécupérerVariableContenuUseCase } from "@/server/gestion-contenu/usecases/RécupérerVariableContenuUseCase";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

export const albertRouter = créerRouteurTRPC({
  chat: procédureProtégée
    .input(
      z.object({
        prompt: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const estAskAiActif = new RécupérerVariableContenuUseCase().run({
        nomVariableContenu: "NEXT_PUBLIC_FF_ASK_AI",
      }) as boolean;

      if (!estAskAiActif && ctx.session.profil !== ProfilEnum.DITP_ADMIN) {
        throw new NotFoundError("Not found");
      }

      const territoiresAccessibles =
        ctx.session.habilitations.lecture.territoires;

      const container = getContainer("albert");
      const createGetSyntheseTerritoireTool = container.resolve(
        "createGetSyntheseTerritoireTool",
      );

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
