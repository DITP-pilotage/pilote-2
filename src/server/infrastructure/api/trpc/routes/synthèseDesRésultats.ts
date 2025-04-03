import { z } from 'zod';
import { créerRouteurTRPC, procédureProtégée, vérifierSiLeCSRFEstValide } from '@/server/infrastructure/api/trpc/trpc';
import {
  validationSynthèseDesRésultatsContexte,
  validationSynthèseDesRésultatsFormulaire,
} from 'validation/synthèseDesRésultats';
import { getContainer } from '@/server/dependances';

const zodValidateurCSRF = z.object({
  csrf: z.string(),
});

export const synthèseDesRésultatsRouter = créerRouteurTRPC({
  créer: procédureProtégée
    .input(validationSynthèseDesRésultatsContexte.merge(zodValidateurCSRF).merge(validationSynthèseDesRésultatsFormulaire))
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteur_id = ctx.session.user.id;

      return getContainer('chantiers').resolve('créerUneSynthèseDesRésultatsUseCase').run(input.réformeId, input.territoireCode, input.contenu, auteur_id, input.météo, ctx.session.habilitations);
    }),

  récupérerHistorique: procédureProtégée
    .input(validationSynthèseDesRésultatsContexte)
    .query(({ input, ctx }) =>{
      return getContainer('chantiers').resolve('récupérerHistoriqueSynthèseDesRésultatsUseCase').run(input.réformeId, input.territoireCode, ctx.session.habilitations);
    }),

  récupérerLaPlusRécente: procédureProtégée
    .input(validationSynthèseDesRésultatsContexte)
    .query(({ input, ctx }) => {
      return getContainer('chantiers').resolve('récupérerSynthèseDesRésultatsLaPlusRécenteUseCase').run(input.réformeId, input.territoireCode, ctx.session.habilitations);
    }),
});
