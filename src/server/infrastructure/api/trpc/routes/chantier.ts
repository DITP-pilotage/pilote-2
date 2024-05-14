import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import { validationChantierContexte, validationChantiersContexte } from '@/validation/chantier';
import RécupérerChantierUseCase from '@/server/usecase/chantier/RécupérerChantierUseCase';
import RécupérerStatistiquesAvancementChantiersUseCase
  from '@/server/usecase/chantier/RécupérerStatistiquesAvancementChantiersUseCase';
import { Maille } from '@/server/domain/maille/Maille.interface';
import RécupérerChantiersSynthétisésUseCase from '@/server/usecase/chantier/RécupérerChantiersSynthétisésUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import {
  presenterEnAvancementsStatistiquesAccueilContrat,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';

export const chantierRouter = créerRouteurTRPC({
  récupérer: procédureProtégée
    .input(validationChantierContexte)
    .query(({ input, ctx }) => {
      const récupérerChantierUseCase = new RécupérerChantierUseCase(
        dependencies.getChantierRepository(),
        dependencies.getChantierDatesDeMàjRepository(),
        dependencies.getMinistèreRepository(),
        dependencies.getTerritoireRepository(),
      );
      return récupérerChantierUseCase.run(input.chantierId, ctx.session.habilitations, ctx.session.profil);
    }),

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

