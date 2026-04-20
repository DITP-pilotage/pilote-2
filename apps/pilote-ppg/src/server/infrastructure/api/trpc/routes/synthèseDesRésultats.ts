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
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";

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
        .resolve("modifierSyntheseDesResultatsPublieeUseCase")
        .execute({
          syntheseId: input.syntheseId,
          contenu: input.contenu,
          meteo: input.meteo,
          auteurModificationId: ctx.session.user.id,
          dateModification: new Date().toISOString(),
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
        .resolve("publierSyntheseDesResultatsUseCase")
        .execute({
          chantierId: input.chantierId,
          territoireCode: input.territoireCode,
          contenu: input.contenu,
          meteo: input.meteo,
          auteurId: ctx.session.user.id,
          date: new Date().toISOString(),
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
        .resolve("enregistrerBrouillonSyntheseDesResultatsUseCase")
        .execute({
          chantierId: input.chantierId,
          territoireCode: input.territoireCode,
          contenu: input.contenu,
          meteo: input.meteo,
          auteurId: ctx.session.user.id,
          date: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  publierUnBrouillon: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationSynthèseDesRésultatsFormulaire)
        .merge(validationBrouillonAPublier),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("importSyntheseDesResultats")
        .resolve("publierBrouillonSyntheseDesResultatsUseCase")
        .execute({
          brouillonId: input.brouillonId,
          contenu: input.contenu,
          meteo: input.meteo,
          auteurModificationId: ctx.session.user.id,
          dateModification: new Date().toISOString(),
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

      return getContainer("importSyntheseDesResultats")
        .resolve("modifierBrouillonSyntheseDesResultatsUseCase")
        .execute({
          brouillonId: input.brouillonId,
          contenu: input.contenu,
          meteo: input.meteo,
          auteurModificationId: ctx.session.user.id,
          dateModification: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  récupérerHistorique: procédureProtégée
    .input(validationSynthèseDesRésultatsContexte)
    .query(({ input, ctx }) => {
      new Habilitation(
        ctx.session.habilitations,
      ).vérifierLesHabilitationsEnLecture(
        input.chantierId,
        input.territoireCode,
      );
      return getContainer("importSyntheseDesResultats")
        .resolve("récupérerHistoriqueSyntheseDesResultatsQuery")
        .run(input.chantierId, input.territoireCode);
    }),
});
