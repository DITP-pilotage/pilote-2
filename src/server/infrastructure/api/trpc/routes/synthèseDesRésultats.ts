import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import {
  validationBrouillonAPublier,
  validationSyntheseAModifier,
  validationSynthèseDesRésultatsContexte,
  validationSynthèseDesRésultatsFormulaire,
} from "validation/synthèseDesRésultats";

import { getContainer } from "@/server/dependances";

const zodValidateurCSRF = z.object({
  csrf: z.string(),
});

export const synthèseDesRésultatsRouter = créerRouteurTRPC({
  modifier: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationSynthèseDesRésultatsFormulaire)
        .merge(validationSyntheseAModifier),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("importSyntheseDesResultats")
        .resolve("modifierUneSyntheseDesResultatsUseCase")
        .execute({
          syntheseAModifier: input.syntheseAModifier,
          contenu: input.contenu,
          météo: input.meteo,
          auteur_modification_id: ctx.session.user.id,
          date_modification: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  publier: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationSynthèseDesRésultatsFormulaire)
        .merge(validationSynthèseDesRésultatsContexte),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("importSyntheseDesResultats")
        .resolve("créerUneSyntheseDesResultatsUseCase")
        .execute({
          chantierId: input.réformeId,
          territoireCode: input.territoireCode,
          contenu: input.contenu,
          météo: input.meteo,
          auteur_id: ctx.session.user.id,
          date_creation: new Date().toISOString(),
          statut: "PUBLIE",
          habilitations: ctx.session.habilitations,
        });
    }),

  enregistrerEnBrouillon: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationSynthèseDesRésultatsFormulaire)
        .merge(validationSynthèseDesRésultatsContexte),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("importSyntheseDesResultats")
        .resolve("créerUneSyntheseDesResultatsUseCase")
        .execute({
          chantierId: input.réformeId,
          territoireCode: input.territoireCode,
          contenu: input.contenu,
          météo: input.meteo,
          auteur_id: ctx.session.user.id,
          date_creation: new Date().toISOString(),
          statut: "BROUILLON",
          habilitations: ctx.session.habilitations,
        });
    }),

  récupérerHistorique: procédureProtégée
    .input(validationSynthèseDesRésultatsContexte)
    .query(({ input }) => {
      return getContainer("importSyntheseDesResultats")
        .resolve("récupérerHistoriqueSyntheseDesResultatsQuery")
        .run(input.réformeId, input.territoireCode);
    }),

  publierUnBrouillon: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationSynthèseDesRésultatsFormulaire)
        .merge(validationBrouillonAPublier),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      const auteur_modification_id = ctx.session.user.id;
      const date_modification = new Date().toISOString();

      return getContainer("importSyntheseDesResultats")
        .resolve("modifierUneSyntheseDesResultatsUseCase")
        .execute({
          syntheseAModifier: {
            ...input.brouillon,
            météo: input.brouillon.meteo,
            auteur_modification_id,
            date_modification,
          },
          contenu: input.contenu,
          météo: input.meteo,
          auteur_modification_id,
          date_modification,
          habilitations: ctx.session.habilitations,
        });
    }),

  modifierLeBrouillon: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationSynthèseDesRésultatsFormulaire)
        .merge(validationBrouillonAPublier),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      const auteur_modification_id = ctx.session.user.id;
      const date_modification = new Date().toISOString();

      return getContainer("importSyntheseDesResultats")
        .resolve("modifierUneSyntheseDesResultatsUseCase")
        .execute({
          syntheseAModifier: {
            ...input.brouillon,
            météo: input.brouillon.meteo,
            auteur_modification_id,
            date_modification,
          },
          contenu: input.contenu,
          météo: input.meteo,
          auteur_modification_id,
          date_modification,
          statut: "BROUILLON",
          habilitations: ctx.session.habilitations,
        });
    }),

  recupererDernierBrouillon: procédureProtégée
    .input(validationSynthèseDesRésultatsContexte)
    .query(({ input, ctx }) => {
      return getContainer("importSyntheseDesResultats")
        .resolve("recupererDernierBrouillonSyntheseDesResultatsQuery")
        .run(input.réformeId, input.territoireCode, ctx.session.user.id);
    }),
});
