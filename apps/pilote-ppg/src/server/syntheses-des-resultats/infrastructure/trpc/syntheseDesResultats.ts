import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import {
  validationBrouillonAPublier,
  validationSyntheseAModifier,
  validationSynthèseDesRésultatsBrouillon,
  validationSynthèseDesRésultatsContexte,
  validationSynthèseDesRésultatsFormulaire,
} from "@/validation/synthèseDesRésultats";

import { getContainer } from "@/server/dependances";
import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";

export const syntheseDesResultatsRouter = createTRPCRouter({
  modifier: protectedProcedure
    .input(
      validationSynthèseDesRésultatsFormulaire.merge(
        validationSyntheseAModifier,
      ),
    )
    .mutation(({ input, ctx }) => {
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

  publier: protectedProcedure
    .input(
      validationSynthèseDesRésultatsFormulaire.merge(
        validationSynthèseDesRésultatsContexte,
      ),
    )
    .mutation(({ input, ctx }) => {
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

  enregistrerEnBrouillon: protectedProcedure
    .input(
      validationSynthèseDesRésultatsBrouillon.merge(
        validationSynthèseDesRésultatsContexte,
      ),
    )
    .mutation(({ input, ctx }) => {
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

  publierUnBrouillon: protectedProcedure
    .input(
      validationSynthèseDesRésultatsFormulaire.merge(
        validationBrouillonAPublier,
      ),
    )
    .mutation(({ input, ctx }) => {
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

  modifierLeBrouillon: protectedProcedure
    .input(
      validationSynthèseDesRésultatsBrouillon.merge(
        validationBrouillonAPublier,
      ),
    )
    .mutation(({ input, ctx }) => {
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

  recupererHistorique: protectedProcedure
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
