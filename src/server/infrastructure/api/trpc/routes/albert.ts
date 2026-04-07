import { z } from "zod";
import { $Enums } from "@prisma/client";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { Albert, displayChoicesTool } from "@/server/albert/Albert";
import { buildChatSystemPrompt } from "@/server/albert/systemPrompt";
import { getContainer } from "@/server/dependances";
import { RecupererVariableContenuUseCase } from "@/server/gestion-contenu/usecases/RecupererVariableContenuUseCase";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

export const albertRouter = créerRouteurTRPC({
  chat: procédureProtégée
    .input(
      z.object({
        chatId: z.string().min(1),
        prompt: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const estAskAiActif = new RecupererVariableContenuUseCase().run({
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
      const createExportRapportTool = container.resolve(
        "createExportRapportTool",
      );

      const systemPrompt = buildChatSystemPrompt({ territoiresAccessibles });
      const getTauxAvancementTerritoire = createGetTauxAvancementTerritoireTool(
        {
          habilitations: ctx.session.habilitations,
        },
      );
      const getChantiersEnRetard = createGetChantiersEnRetardTool({
        territoiresAccessibles,
      });
      const getChantiersEnDifficulte = createGetChantiersEnDifficulteTool({
        territoiresAccessibles,
      });
      const getValeursIndicateur = createGetValeursIndicateurTool({
        territoiresAccessibles,
      });
      const exportRapport = createExportRapportTool({
        userId: ctx.session.user.id,
      });

      return Albert.generateText({
        chatId: input.chatId,
        prompt: input.prompt,
        systemPrompt,
        userId: ctx.session.user.id,
        tools: {
          get_taux_avancement_territoire: getTauxAvancementTerritoire,
          get_chantiers_en_retard: getChantiersEnRetard,
          get_chantiers_en_difficulte: getChantiersEnDifficulte,
          get_valeurs_indicateur: getValeursIndicateur,
          display_choices: displayChoicesTool,
          export_rapport: exportRapport,
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
