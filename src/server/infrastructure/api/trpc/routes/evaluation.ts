import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { enregisterBrouillonCommandSchema } from "@/server/evaluation/handlers/EnregistrerBrouillonAutoEvaluationHandler";
import { getContainer } from "@/server/dependances";
import { PrismaPilote } from "@/server/db/PrismaPilote";

// class AccesFicheEvaluationService {
//   constructor(private readonly dependencies: { prisma: PrismaPilote }) {}
//
// }

export const evaluationRouter = créerRouteurTRPC({
  enregistrerBrouillon: procédureProtégée
    .input(enregisterBrouillonCommandSchema)
    .mutation(async ({ input, ctx }) => {
      await getContainer("piloteEval")
        .resolve("enregistrerBrouillonAutoEvaluation")
        .execute(input, ctx.session.user.id);
    }),
});
