import {
  créerRouteurTRPC,
  procédureProtégée,
} from '@/server/infrastructure/api/trpc/trpc';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { validationChantierContexte } from '@/validation/chantier';
import RécupérerChantierUseCase from '@/server/usecase/chantier/RécupérerChantierUseCase';

export const chantierRouter = créerRouteurTRPC({
  récupérer: procédureProtégée
    .input(validationChantierContexte)
    .query(({ input, ctx }) => {
      const récupérerChantierUseCase = new RécupérerChantierUseCase(dependencies.getChantierRepository());
      return récupérerChantierUseCase.run(input.chantierId, ctx.session.habilitation);
    }),
});
