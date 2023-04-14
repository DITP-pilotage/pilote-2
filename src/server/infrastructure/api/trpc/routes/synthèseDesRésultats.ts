import { z } from 'zod';
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from '@/server/infrastructure/api/trpc/trpc';
import CréerUneSynthèseDesRésultatsUseCase from '@/server/usecase/synthèse/CréerUneSynthèseDesRésultatsUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase from '@/server/usecase/synthèse/RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase';
import { validationSynthèseDesRésultatsContexte, validationSynthèseDesRésultatsFormulaire } from 'validation/synthèseDesRésultats';
import RécupérerHistoriqueSynthèseDesRésultatsUseCase from '@/server/usecase/synthèse/RécupérerHistoriqueSynthèseDesRésultatsUseCase';

const zodValidateurCSRF = z.object({
  csrf: z.string(),
});

export const synthèseDesRésultatsRouter = créerRouteurTRPC({
  créer: procédureProtégée
    .input(validationSynthèseDesRésultatsContexte.merge(zodValidateurCSRF).merge(validationSynthèseDesRésultatsFormulaire))
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteur = ctx.session.user.name ?? '';

      const créerUneSynthèseDesRésultatsUseCase = new CréerUneSynthèseDesRésultatsUseCase(dependencies.getSynthèseDesRésultatsRepository());
      return créerUneSynthèseDesRésultatsUseCase.run(input.chantierId, input.maille, input.codeInsee, input.contenu, auteur, input.météo);
    }),

  récupérerHistorique: procédureProtégée
    .input(validationSynthèseDesRésultatsContexte)
    .query(({ input }) =>{
      const récupérerHistoriqueSynthèseDesRésultatsUseCase = new RécupérerHistoriqueSynthèseDesRésultatsUseCase(dependencies.getSynthèseDesRésultatsRepository());
      return récupérerHistoriqueSynthèseDesRésultatsUseCase.run(input.chantierId, input.maille, input.codeInsee);
    }),

  récupérerLaPlusRécente: procédureProtégée
    .input(validationSynthèseDesRésultatsContexte)
    .query(({ input }) => {
      const récupérerSynthèseDesRésultatsLaPlusRécenteUseCase = new RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase(dependencies.getSynthèseDesRésultatsRepository());
      return récupérerSynthèseDesRésultatsLaPlusRécenteUseCase.run(input.chantierId, input.maille, input.codeInsee);
    }),
});
