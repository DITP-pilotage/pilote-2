import {
  créerRouteurTRPC,
  procédureProtégée,
} from '@/server/infrastructure/api/trpc/trpc';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { validationChantierContexte } from '@/validation/chantier';
import RécupérerChantierUseCase from '@/server/usecase/chantier/RécupérerChantierUseCase';
import { SCOPE_LECTURE } from '@/server/domain/identité/Habilitation';

export const chantierRouter = créerRouteurTRPC({
  récupérer: procédureProtégée
    .input(validationChantierContexte)
    .query(({ input, ctx }) => {
      const récupérerChantierUseCase = new RécupérerChantierUseCase(dependencies.getChantierRepository());
      return récupérerChantierUseCase.run(input.chantierId, ctx.session.habilitation, SCOPE_LECTURE);
    }),
});
