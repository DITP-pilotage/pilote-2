import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { validationDétailsIndicateur, validationDétailsIndicateurs } from '@/validation/indicateur';
import RécupérerDétailsIndicateursUseCase from '@/server/usecase/indicateur/RécupérerDétailsIndicateursUseCase';
import RécupérerDétailsIndicateurUseCase from '@/server/usecase/indicateur/RécupérerDétailsIndicateurUseCase';

export const indicateurRouter = créerRouteurTRPC({
  récupererDétailsIndicateurs: procédureProtégée
    .input(validationDétailsIndicateurs)
    .query(async ({ input }) => {
      const récupérerDétailsIndicateursUseCase = new RécupérerDétailsIndicateursUseCase(dependencies.getIndicateurRepository());
      return récupérerDétailsIndicateursUseCase.run(input.chantierId, input.maille, input.codesInsee);
    }),
  récupererDétailsIndicateur: procédureProtégée
    .input(validationDétailsIndicateur)
    .query(async ({ input, ctx }) => {
      const récupérerDétailIndicateurUseCase = new RécupérerDétailsIndicateurUseCase(dependencies.getIndicateurRepository());
      return récupérerDétailIndicateurUseCase.run(input.indicateurId, ctx.session.habilitations);
    }),
});
