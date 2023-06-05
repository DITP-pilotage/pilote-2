import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { validationDétailsIndicateur, validationDétailsIndicateurs } from '@/validation/indicateur';
import RécupérerDétailsIndicateursUseCase from '@/server/usecase/chantier/indicateur/RécupérerDétailsIndicateursUseCase';
import RécupérerDétailsIndicateurUseCase from '@/server/usecase/chantier/indicateur/RécupérerDétailsIndicateurUseCase';

export const indicateurRouter = créerRouteurTRPC({
  récupererDétailsIndicateurs: procédureProtégée
    .input(validationDétailsIndicateurs)
    .query(async ({ input, ctx }) => {
      const récupérerDétailsIndicateursUseCase = new RécupérerDétailsIndicateursUseCase(dependencies.getIndicateurRepository());
      return récupérerDétailsIndicateursUseCase.run(input.chantierId, input.territoireCodes, ctx.session.habilitations);
    }),
  récupererDétailsIndicateur: procédureProtégée
    .input(validationDétailsIndicateur)
    .query(async ({ input, ctx }) => {
      const récupérerDétailIndicateurUseCase = new RécupérerDétailsIndicateurUseCase(dependencies.getIndicateurRepository());
      return récupérerDétailIndicateurUseCase.run(input.indicateurId, ctx.session.habilitations);
    }),
});
