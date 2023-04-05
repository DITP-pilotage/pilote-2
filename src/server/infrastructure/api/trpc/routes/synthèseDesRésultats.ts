import { z } from 'zod';

import {
  créerRouteurTRPC,
  procédureProtégée,
} from '@/server/infrastructure/api/trpc/trpc';
import { mailles } from '@/server/domain/maille/Maille.interface';
import { météos } from '@/server/domain/météo/Météo.interface';
import CréerUneSynthèseDesRésultatsUseCase from '@/server/usecase/synthèse/CréerUneSynthèseDesRésultatsUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase from '@/server/usecase/synthèse/RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase/RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase';

export const synthèseDesRésultatsRouter = créerRouteurTRPC({
  créer: procédureProtégée.input(
    z.object({
      chantierId: z.string(),
      maille: z.enum(mailles),
      codeInsee: z.string(),
      contenu: z.string().max(5000).min(1),
      météo: z.enum(météos),
      csrf: z.string(),
    }),
  ).mutation(({ input }) => {
    const créerUneSynthèseDesRésultatsUseCase = new CréerUneSynthèseDesRésultatsUseCase(dependencies.getSynthèseDesRésultatsRepository());
    return créerUneSynthèseDesRésultatsUseCase.run(input.chantierId, input.maille, input.codeInsee, input.contenu, '', input.météo);
  }),
  récupérerLaPlusRécente: procédureProtégée.input(
    z.object({
      chantierId: z.string(),
      maille: z.enum(mailles),
      codeInsee: z.string(),
    }),
  ).query(({ input }) => {
    const récupérerSynthèseDesRésultatsLaPlusRécenteUseCase = new RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase(dependencies.getSynthèseDesRésultatsRepository());
    return récupérerSynthèseDesRésultatsLaPlusRécenteUseCase.run(input.chantierId, input.maille, input.codeInsee);
  }),
});
