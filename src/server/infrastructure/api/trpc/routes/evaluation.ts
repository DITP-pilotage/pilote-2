import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { enregisterBrouillonCommandSchema } from "@/server/evaluation/handlers/EnregistrerBrouillonAutoEvaluationHandler";
import { getContainer } from "@/server/dependances";
import { ForbiddenError } from "@/server/app/error-boundary/forbidden-error";
import { soumettreAutoEvaluationCommandSchema } from "@/server/evaluation/handlers/SoumettreAutoEvaluationHandler";

export const evaluationRouter = créerRouteurTRPC({
  enregistrerBrouillon: procédureProtégée
    .input(enregisterBrouillonCommandSchema)
    .mutation(async ({ input, ctx }) => {
      const peutAccederFicheAutoEvaluation = await getContainer("piloteEval")
        .resolve("accesFicheEvaluationService")
        .peutAccederFicheAutoEvaluation({
          utilisateurId: ctx.session.user.id,
          ficheEvaluationId: input.ficheEvaluationId,
        });

      if (!peutAccederFicheAutoEvaluation)
        throw new ForbiddenError("Accès refusé à la fiche d'auto-évaluation");

      await getContainer("piloteEval")
        .resolve("enregistrerBrouillonAutoEvaluation")
        .execute(input, ctx.session.user.id);
    }),

  soumettreAutoEvaluation: procédureProtégée
    .input(soumettreAutoEvaluationCommandSchema)
    .mutation(async ({ input, ctx }) => {
      const peutAccederFicheAutoEvaluation = await getContainer("piloteEval")
        .resolve("accesFicheEvaluationService")
        .peutAccederFicheAutoEvaluation({
          utilisateurId: ctx.session.user.id,
          ficheEvaluationId: input.ficheEvaluationId,
        });

      if (!peutAccederFicheAutoEvaluation)
        throw new ForbiddenError("Accès refusé à la fiche d'auto-évaluation");

      await getContainer("piloteEval")
        .resolve("soumettreAutoEvaluationHandler")
        .execute(input, ctx.session.user.id);
    }),
});
