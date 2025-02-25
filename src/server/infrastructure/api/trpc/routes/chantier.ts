import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import { getContainer } from '@/server/dependances';

export const chantierRouter = créerRouteurTRPC({
  récupérerTousSynthétisésAccessiblesEnLecture: procédureProtégée
    .query(({ ctx }) => {
      const récupérerChantiersSynthétisésUseCase = getContainer('gestionUtilisateur').resolve('recupererChantiersSynthetisesUseCase');
      return récupérerChantiersSynthétisésUseCase.run({
        listeChantierIdLecture: ctx.session.habilitations.lecture.chantiers,
      });
    }),
});

