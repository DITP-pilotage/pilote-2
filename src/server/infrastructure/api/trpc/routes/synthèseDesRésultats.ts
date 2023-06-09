import { z } from 'zod';
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from '@/server/infrastructure/api/trpc/trpc';
import CréerUneSynthèseDesRésultatsUseCase from '@/server/usecase/chantier/synthèse/CréerUneSynthèseDesRésultatsUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase from '@/server/usecase/chantier/synthèse/RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase';
import { validationSynthèseDesRésultatsContexte, validationSynthèseDesRésultatsFormulaire } from 'validation/synthèseDesRésultats';
import RécupérerHistoriqueSynthèseDesRésultatsUseCase from '@/server/usecase/chantier/synthèse/RécupérerHistoriqueSynthèseDesRésultatsUseCase';
import { déterminerLeTypeDeRéforme } from '@/server/utils/réforme';
import RécupérerSynthèseDesRésultatsLaPlusRécenteProjetStructurantUseCase
  from '@/server/usecase/projetStructurant/synthèse/RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase';

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
      return créerUneSynthèseDesRésultatsUseCase.run(input.réformeId, input.territoireCode, input.contenu, auteur, input.météo, ctx.session.habilitations);
    }),

  récupérerHistorique: procédureProtégée
    .input(validationSynthèseDesRésultatsContexte)
    .query(({ input, ctx }) =>{
      const récupérerHistoriqueSynthèseDesRésultatsUseCase = new RécupérerHistoriqueSynthèseDesRésultatsUseCase(dependencies.getSynthèseDesRésultatsRepository());
      return récupérerHistoriqueSynthèseDesRésultatsUseCase.run(input.réformeId, input.territoireCode, ctx.session.habilitations);
    }),

  récupérerLaPlusRécente: procédureProtégée
    .input(validationSynthèseDesRésultatsContexte)
    .query(({ input, ctx }) => {
      const typeDeRéforme = déterminerLeTypeDeRéforme(input.réformeId);

      if (typeDeRéforme === 'chantier') {
        const récupérerSynthèseDesRésultatsLaPlusRécenteUseCase = new RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase(dependencies.getSynthèseDesRésultatsRepository());
        return récupérerSynthèseDesRésultatsLaPlusRécenteUseCase.run(input.réformeId, input.territoireCode, ctx.session.habilitations);
      } else if (typeDeRéforme === 'projet structurant') {
        const récupérerSynthèseDesRésultatsLaPlusRécenteUseCase = new RécupérerSynthèseDesRésultatsLaPlusRécenteProjetStructurantUseCase(dependencies.getSynthèseDesRésultatsProjetStructurantRepository());
        return récupérerSynthèseDesRésultatsLaPlusRécenteUseCase.run(input.réformeId, ctx.session.habilitations);
      }
    }),
});
