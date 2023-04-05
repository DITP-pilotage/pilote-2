import { z } from 'zod';
import { LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS } from '@/server/domain/commentaire/Commentaire.validator';

import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from '@/server/infrastructure/api/trpc/trpc';
import { mailles } from '@/server/domain/maille/Maille.interface';
import { météosSaisissables } from '@/server/domain/météo/Météo.interface';
import CréerUneSynthèseDesRésultatsUseCase from '@/server/usecase/synthèse/CréerUneSynthèseDesRésultatsUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase from '@/server/usecase/synthèse/RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase';

const zodValidateurSélecteur = z.object({
  chantierId: z.string(),
  maille: z.enum(mailles),
  codeInsee: z.string(),
});

const zodValidateurCréer = z.object({
  csrf: z.string(),
  contenu: z.string().max(LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS).min(1),
  météo: z.enum(météosSaisissables),
});

export const synthèseDesRésultatsRouter = créerRouteurTRPC({
  créer: procédureProtégée
    .input(zodValidateurSélecteur.merge(zodValidateurCréer))
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteur = ctx.session.user.name ?? '';

      const créerUneSynthèseDesRésultatsUseCase = new CréerUneSynthèseDesRésultatsUseCase(dependencies.getSynthèseDesRésultatsRepository());
      return créerUneSynthèseDesRésultatsUseCase.run(input.chantierId, input.maille, input.codeInsee, input.contenu, auteur, input.météo);
    }),

  récupérerLaPlusRécente: procédureProtégée
    .input(zodValidateurSélecteur)
    .query(({ input }) => {
      const récupérerSynthèseDesRésultatsLaPlusRécenteUseCase = new RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase(dependencies.getSynthèseDesRésultatsRepository());
      return récupérerSynthèseDesRésultatsLaPlusRécenteUseCase.run(input.chantierId, input.maille, input.codeInsee);
    }),
});
