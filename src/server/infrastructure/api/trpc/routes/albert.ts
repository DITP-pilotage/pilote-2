import { z } from "zod";
import { $Enums } from "@prisma/client";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import {
  Albert,
  displayChoicesTool,
  displayValeursIndicateurTool,
} from "@/server/albert/Albert";
import { buildChatSystemPrompt } from "@/server/albert/systemPrompt";
import { getContainer } from "@/server/dependances";
import { RécupérerVariableContenuUseCase } from "@/server/gestion-contenu/usecases/RécupérerVariableContenuUseCase";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { getInstructionsTool } from "@/server/albert/recipes";

export const albertRouter = créerRouteurTRPC({
  chat: procédureProtégée
    .input(
      z.object({
        chatId: z.string().min(1),
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
      const createGetTauxAvancementTerritoireTool = container.resolve(
        "createGetTauxAvancementTerritoireTool",
      );
      const createGetChantiersEnRetardTool = container.resolve(
        "createGetChantiersEnRetardTool",
      );
      const createGetChantiersEnDifficulteTool = container.resolve(
        "createGetChantiersEnDifficulteTool",
      );
      const createGetValeursIndicateurTool = container.resolve(
        "createGetValeursIndicateurTool",
      );

      const systemPrompt = buildChatSystemPrompt({ territoiresAccessibles });
      const getTauxAvancementTerritoire =
        createGetTauxAvancementTerritoireTool({
          habilitations: ctx.session.habilitations,
        });
      const getChantiersEnRetard = createGetChantiersEnRetardTool({
        territoiresAccessibles,
      });
      const getChantiersEnDifficulte = createGetChantiersEnDifficulteTool({
        territoiresAccessibles,
      });
      const getValeursIndicateur = createGetValeursIndicateurTool({
        territoiresAccessibles,
      });

      return Albert.generateText({
        chatId: input.chatId,
        prompt: input.prompt,
        systemPrompt,
        userId: ctx.session.user.id,
        tools: {
          get_instructions: getInstructionsTool,
          get_taux_avancement_territoire: getTauxAvancementTerritoire,
          get_chantiers_en_retard: getChantiersEnRetard,
          get_chantiers_en_difficulte: getChantiersEnDifficulte,
          get_valeurs_indicateur: getValeursIndicateur,
          display_choices: displayChoicesTool,
          display_valeurs_indicateur: displayValeursIndicateurTool,
        },
      });
    }),

  evaluer: procédureProtégée
    .input(
      z.discriminatedUnion("evaluation", [
        z.object({
          chatId: z.string().min(1),
          evaluation: z.literal($Enums.llm_call_evaluation.POSITIVE),
        }),
        z.object({
          chatId: z.string().min(1),
          evaluation: z.literal($Enums.llm_call_evaluation.NEGATIVE),
          commentaire: z.string().min(1),
        }),
      ]),
    )
    .mutation(async ({ input }) => {
      const container = getContainer("albert");
      const evaluerChatUseCase = container.resolve("evaluerChatUseCase");
      await evaluerChatUseCase.execute({
        chatId: input.chatId,
        evaluation: input.evaluation,
        commentaire:
          input.evaluation === $Enums.llm_call_evaluation.NEGATIVE
            ? input.commentaire
            : undefined,
      });
    }),
});
