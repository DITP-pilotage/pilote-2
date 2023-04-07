import { z } from 'zod';
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from '@/server/infrastructure/api/trpc/trpc';
import { dependencies } from '@/server/infrastructure/Dependencies';
import RécupérerLHistoriqueDUnObjectifUseCase from '@/server/usecase/objectif/RécupérerLHistoriqueDUnObjectifUseCase';
import CréerUnObjectifUseCase from '@/server/usecase/objectif/CréerUnObjectifUseCase';
import RécupérerLesObjectifsLesPlusRécentsParTypeUseCase from '@/server/usecase/objectif/RécupérerLesObjectifsLesPlusRécentsUseCase';
import {
  validationObjectifContexte,
  validationObjectifFormulaire,
  validationObjectifHistorique,
} from '@/validation/objectif';

const zodValidateurCSRF = z.object({
  csrf: z.string(),
});

export const objectifRouter = créerRouteurTRPC({
  créer: procédureProtégée
    .input(validationObjectifContexte.merge(zodValidateurCSRF).merge(validationObjectifFormulaire))
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteur = ctx.session.user.name ?? '';

      const créerUnObjectifUseCase = new CréerUnObjectifUseCase(dependencies.getObjectifRepository());
      return créerUnObjectifUseCase.run(input.chantierId, input.contenu, auteur, input.type);
    }),

  récupérerLePlusRécent: procédureProtégée
    .input(validationObjectifContexte)
    .query(({ input }) => {
      const récupérerLesObjectifsLesPlusRécentsParTypeUseCase = new RécupérerLesObjectifsLesPlusRécentsParTypeUseCase(dependencies.getObjectifRepository());
      return récupérerLesObjectifsLesPlusRécentsParTypeUseCase.run(input.chantierId);
    }),

  historique: procédureProtégée
    .input(validationObjectifContexte.merge(validationObjectifHistorique))
    .query(({ input }) => {
      const récupérerLHistoriqueDUnObjectifUseCase = new RécupérerLHistoriqueDUnObjectifUseCase(dependencies.getObjectifRepository());
      return récupérerLHistoriqueDUnObjectifUseCase.run(input.chantierId, input.type);
    }),
});
