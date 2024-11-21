import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import { validationChantiersContexte } from '@/validation/chantier';
import RécupérerStatistiquesAvancementChantiersUseCase
  from '@/server/usecase/chantier/RécupérerStatistiquesAvancementChantiersUseCase';
import { Maille } from '@/server/domain/maille/Maille.interface';
import RécupérerChantiersSynthétisésUseCase from '@/server/usecase/chantier/RécupérerChantiersSynthétisésUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import {
  presenterEnAvancementsStatistiquesAccueilContrat,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';

export const chantierRouter = créerRouteurTRPC({
  récupérerTousSynthétisésAccessiblesEnLecture: procédureProtégée
    .query(({ ctx }) => {
      const récupérerChantiersSynthétisésUseCase = new RécupérerChantiersSynthétisésUseCase(dependencies.getChantierRepository());
      return récupérerChantiersSynthétisésUseCase.run(ctx.session.habilitations);
    }),

  récupérerStatistiquesAvancements: procédureProtégée
    .input(validationChantiersContexte)
    .query(({ input, ctx }) =>{
      const récupérerStatistiquesChantiersUseCase = new RécupérerStatistiquesAvancementChantiersUseCase(dependencies.getChantierRepository());
      return récupérerStatistiquesChantiersUseCase.run(input.chantiers, input.maille as Maille, ctx.session.habilitations).then(presenterEnAvancementsStatistiquesAccueilContrat);
    }),
});

