import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import RécupérerUnProfilUseCase from '@/server/usecase/profil/RécupérerUnProfilUseCase';
import { validationProfilContexte } from '@/validation/profil';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { getContainer } from '@/server/dependances';

export const profilRouter = créerRouteurTRPC({
  récupérerTous: procédureProtégée
    .query(() => {
      return getContainer('gestionUtilisateur').resolve('recupererListeProfilUseCase').run();
    }),

  récupérer: procédureProtégée
    .input(validationProfilContexte)
    .query(({ input }) => {
      return new RécupérerUnProfilUseCase(dependencies.getProfilRepository()).run(input.profilCode);
    }),
});
