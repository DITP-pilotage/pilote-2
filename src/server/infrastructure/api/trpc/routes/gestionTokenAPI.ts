import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import { validationCreationTokenAPI, validationSuppressionTokenAPI } from '@/validation/gestion-token-api';
import { CreerTokenAPIUseCase } from '@/server/authentification/usecases/CreerTokenAPIUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { SupprimerTokenAPIUseCase } from '@/server/authentification/usecases/SupprimerTokenAPIUseCase';

export const gestionTokenAPIRouter = créerRouteurTRPC({
  creerTokenAPI: procédureProtégée
    .input(validationCreationTokenAPI)
    .mutation(async ({ input }) => {

      return new CreerTokenAPIUseCase({
        tokenAPIService: dependencies.getTokenAPIService(),
        tokenAPIInformationRepository: dependencies.getTokenAPIInformationRepository(),
      }).run({ email: input.email });
    }),

  supprimerTokenAPI: procédureProtégée
    .input(validationSuppressionTokenAPI)
    .mutation(async ({ input }) => {

      return new SupprimerTokenAPIUseCase({
        tokenAPIInformationRepository: dependencies.getTokenAPIInformationRepository(),
      }).run({ email: input.email });
    }),
});
