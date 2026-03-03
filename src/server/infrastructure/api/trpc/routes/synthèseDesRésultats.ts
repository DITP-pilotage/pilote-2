import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import CréerUneSynthèseDesRésultatsUseCase from "@/server/usecase/chantier/synthèse/CréerUneSynthèseDesRésultatsUseCase";
import { dependencies } from "@/server/infrastructure/Dependencies";
import RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase from "@/server/usecase/chantier/synthèse/RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase";
import {
  validationSynthèseDesRésultatsContexte,
  validationSynthèseDesRésultatsFormulaire,
} from "validation/synthèseDesRésultats";
import RécupérerHistoriqueSynthèseDesRésultatsUseCase from "@/server/usecase/chantier/synthèse/RécupérerHistoriqueSynthèseDesRésultatsUseCase";
import { getContainer } from "@/server/dependances";
import { météos } from "@/server/domain/météo/Météo.interface";

const zodSynthèseDesRésultatsV2 = z.object({
  id: z.string(),
  chantierId: z.string(),
  territoireCode: z.string(),
  contenu: z.string(),
  météo: z.enum(météos),
  auteur_creation_id: z.string(),
  date_creation: z.string(),
  auteur_modification_id: z.string(),
  date_modification: z.string(),
});

const zodValidateurCSRF = z.object({
  csrf: z.string(),
});

export const synthèseDesRésultatsRouter = créerRouteurTRPC({
  créer: procédureProtégée
    .input(
      validationSynthèseDesRésultatsContexte
        .merge(zodValidateurCSRF)
        .merge(validationSynthèseDesRésultatsFormulaire),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteur_id = ctx.session.user.id;

      const créerUneSynthèseDesRésultatsUseCase =
        new CréerUneSynthèseDesRésultatsUseCase(
          dependencies.getSynthèseDesRésultatsRepository(),
          dependencies.getChantierRepository(),
        );
      return créerUneSynthèseDesRésultatsUseCase.run(
        input.réformeId,
        input.territoireCode,
        input.contenu,
        auteur_id,
        input.météo,
        ctx.session.habilitations,
      );
    }),

  modifier: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationSynthèseDesRésultatsFormulaire)
        .merge(z.object({ synthèsePrécédente: zodSynthèseDesRésultatsV2 })),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("importSyntheseDesResultats")
        .resolve("modifierUneSyntheseDesResultatsUseCase")
        .execute({
          synthèsePrécédente: input.synthèsePrécédente,
          contenu: input.contenu,
          météo: input.météo,
          auteur_modification_id: ctx.session.user.id,
          date_modification: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  récupérerHistorique: procédureProtégée
    .input(validationSynthèseDesRésultatsContexte)
    .query(({ input, ctx }) => {
      const récupérerHistoriqueSynthèseDesRésultatsUseCase =
        new RécupérerHistoriqueSynthèseDesRésultatsUseCase(
          dependencies.getSynthèseDesRésultatsRepository(),
        );
      return récupérerHistoriqueSynthèseDesRésultatsUseCase.run(
        input.réformeId,
        input.territoireCode,
        ctx.session.habilitations,
      );
    }),

  récupérerLaPlusRécente: procédureProtégée
    .input(validationSynthèseDesRésultatsContexte)
    .query(({ input, ctx }) => {
      const récupérerSynthèseDesRésultatsLaPlusRécenteUseCase =
        new RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase(
          dependencies.getSynthèseDesRésultatsRepository(),
        );
      return récupérerSynthèseDesRésultatsLaPlusRécenteUseCase.run(
        input.réformeId,
        input.territoireCode,
        ctx.session.habilitations,
      );
    }),
});
