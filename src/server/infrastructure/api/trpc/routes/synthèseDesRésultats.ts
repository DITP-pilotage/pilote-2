import { z } from 'zod';
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from '@/server/infrastructure/api/trpc/trpc';
import { mailles } from '@/server/domain/maille/Maille.interface';
import CréerUneSynthèseDesRésultatsUseCase from '@/server/usecase/synthèse/CréerUneSynthèseDesRésultatsUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase from '@/server/usecase/synthèse/RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase';
import synthèseDesRésultatsValidateur from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.validateur';

const zodValidateurSélecteur = z.object({
  chantierId: z.string(),
  maille: z.enum(mailles),
  codeInsee: z.string(),
});

const zodValidateurCSRF = z.object({
  csrf: z.string(),
});

export const synthèseDesRésultatsRouter = créerRouteurTRPC({
  créer: procédureProtégée
    .input(zodValidateurSélecteur.merge(zodValidateurCSRF).merge(synthèseDesRésultatsValidateur.créer()))
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
