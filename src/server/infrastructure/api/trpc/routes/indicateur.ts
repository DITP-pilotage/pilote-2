import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { validationDétailsIndicateurs } from '@/validation/indicateur';
import RécupérerDétailsIndicateursUseCase from '@/server/usecase/indicateur/RécupérerDétailsIndicateursUseCase';

export const indicateurRouter = créerRouteurTRPC({
  récupererDétailsIndicateurs: procédureProtégée
    .input(validationDétailsIndicateurs)
    .query(async ({ input }) => {
      const récupérerDétailsIndicateursUseCase = new RécupérerDétailsIndicateursUseCase(dependencies.getIndicateurRepository());
      return récupérerDétailsIndicateursUseCase.run(input.chantierId, input.maille, input.codesInsee);
    }),
});
