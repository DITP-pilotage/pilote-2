import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import {
  validationCreationTokenAPI,
  validationSuppressionTokenAPI,
} from "@/validation/gestion-token-api";
import { CreerTokenAPIUseCase } from "@/server/authentification/usecases/CreerTokenAPIUseCase";
import { SupprimerTokenAPIUseCase } from "@/server/authentification/usecases/SupprimerTokenAPIUseCase";
import { getContainer } from "@/server/dependances";

export const gestionTokenAPIRouter = créerRouteurTRPC({
  creerTokenAPI: procédureProtégée
    .input(validationCreationTokenAPI)
    .mutation(async ({ input, ctx }) => {
      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);

      habilitations.verifierAutorisationModificationTokenAPI();

      return new CreerTokenAPIUseCase({
        tokenAPIService: getContainer("legacy").resolve("tokenAPIService"),
        tokenAPIInformationRepository: getContainer("legacy").resolve(
          "tokenAPIInformationRepository",
        ),
        utilisateurRepository: getContainer("legacy").resolve(
          "authentificationUtilisateurRepository",
        ),
      }).run({ email: input.email });
    }),

  supprimerTokenAPI: procédureProtégée
    .input(validationSuppressionTokenAPI)
    .mutation(async ({ input, ctx }) => {
      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);

      habilitations.verifierAutorisationModificationTokenAPI();

      return new SupprimerTokenAPIUseCase({
        tokenAPIInformationRepository: getContainer("legacy").resolve(
          "tokenAPIInformationRepository",
        ),
      }).run({ email: input.email });
    }),
});
