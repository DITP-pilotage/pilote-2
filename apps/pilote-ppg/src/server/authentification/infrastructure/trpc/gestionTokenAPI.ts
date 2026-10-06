import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import {
  validationCreationTokenAPI,
  validationSuppressionTokenAPI,
} from "@/validation/gestion-token-api";
import { getContainer } from "@/server/dependances";

export const gestionTokenAPIRouter = createTRPCRouter({
  creerTokenAPI: protectedProcedure
    .input(validationCreationTokenAPI)
    .mutation(async ({ input, ctx }) => {
      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);

      habilitations.verifierAutorisationModificationTokenAPI();

      return getContainer("authentification")
        .resolve("creerTokenAPIUseCase")
        .run({ email: input.email });
    }),

  supprimerTokenAPI: protectedProcedure
    .input(validationSuppressionTokenAPI)
    .mutation(async ({ input, ctx }) => {
      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);

      habilitations.verifierAutorisationModificationTokenAPI();

      return getContainer("authentification")
        .resolve("supprimerTokenAPIUseCase")
        .run({ email: input.email });
    }),
});
