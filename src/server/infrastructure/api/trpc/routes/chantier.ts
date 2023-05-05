import {
  créerRouteurTRPC,
  procédureProtégée,
} from '@/server/infrastructure/api/trpc/trpc';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { validationChantierContexte, validationChantiersContexte } from '@/validation/chantier';
import RécupérerChantierUseCase from '@/server/usecase/chantier/RécupérerChantierUseCase';
import RécupérerStatistiquesAvancementChantiersUseCase
  from '@/server/usecase/chantier/RécupérerStatistiquesAvancementChantiersUseCase';
import { Maille } from '@/server/domain/maille/Maille.interface';

export const chantierRouter = créerRouteurTRPC({
  récupérer: procédureProtégée
    .input(validationChantierContexte)
    .query(({ input, ctx }) => {
      const récupérerChantierUseCase = new RécupérerChantierUseCase(dependencies.getChantierRepository());
      return récupérerChantierUseCase.run(input.chantierId, ctx.session.habilitations);
    }),

  récupérerStatistiquesAvancements: procédureProtégée
    .input(validationChantiersContexte)
    .query(({ input }) =>{
      const récupérerStatistiquesChantiersUseCase = new RécupérerStatistiquesAvancementChantiersUseCase(dependencies.getChantierRepository());
      return récupérerStatistiquesChantiersUseCase.run(input.chantiers, input.maille as Maille);
    }),
});

