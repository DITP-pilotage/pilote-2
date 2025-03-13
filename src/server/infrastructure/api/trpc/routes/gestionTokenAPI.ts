import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import { validationCreationTokenAPI, validationSuppressionTokenAPI } from '@/validation/gestion-token-api';
import { CreerTokenAPIUseCase } from '@/server/authentification/usecases/CreerTokenAPIUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { SupprimerTokenAPIUseCase } from '@/server/authentification/usecases/SupprimerTokenAPIUseCase';
import Habilitation from '@/server/gestion-utilisateur/domain/habilitation/Habilitation';

export const gestionTokenAPIRouter = créerRouteurTRPC({
  creerTokenAPI: procédureProtégée
    .input(validationCreationTokenAPI)
    .mutation(async ({ input, ctx }) => {

      const habilitations = new Habilitation(ctx.session.habilitations);

      habilitations.verifierAutorisationCreerTokenAPI(ctx.session.profil);

      return new CreerTokenAPIUseCase({
        tokenAPIService: dependencies.getTokenAPIService(),
        tokenAPIInformationRepository: dependencies.getTokenAPIInformationRepository(),
        utilisateurRepository: dependencies.getAuthentificationUtilisateurRepository(),
      }).run({ email: input.email });
    }),

  supprimerTokenAPI: procédureProtégée
    .input(validationSuppressionTokenAPI)
    .mutation(async ({ input, ctx }) => {
      const habilitations = new Habilitation(ctx.session.habilitations);

      habilitations.verifierAutorisationCreerTokenAPI(ctx.session.profil);

      return new SupprimerTokenAPIUseCase({
        tokenAPIInformationRepository: dependencies.getTokenAPIInformationRepository(),
      }).run({ email: input.email });
    }),
});
