import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import RécupérerListeProfilUseCase from '@/server/usecase/profil/RécupérerListeProfilUseCase';
import RécupérerUnProfilUseCase from '@/server/usecase/profil/RécupérerUnProfilUseCase';
import { validationProfilContexte } from '@/validation/profil';

export const profilRouter = créerRouteurTRPC({
  récupérerTous: procédureProtégée
    .query(() => {
      return new RécupérerListeProfilUseCase().run();
    }),

  récupérer: procédureProtégée
    .input(validationProfilContexte)
    .query(({ input }) => {
      return new RécupérerUnProfilUseCase().run(input.profilCode);
    }),
});
