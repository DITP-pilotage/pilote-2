import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";
import {
  validationObjectifContexte,
  validationObjectifFormulaire,
  validationBrouillonObjectifAPublier,
  validationObjectifAModifier,
} from "validation/objectif";

const zodValidateurCSRF = z.object({
  csrf: z.string(),
});

export const objectifRouter = créerRouteurTRPC({
  publier: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationObjectifFormulaire)
        .merge(validationObjectifContexte),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("objectif")
        .resolve("publierObjectifUseCase")
        .execute({
          chantierId: input.chantierId,
          type: input.type,
          contenu: input.contenu,
          auteurId: ctx.session.user.id,
          date: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  enregistrerEnBrouillon: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationObjectifFormulaire)
        .merge(validationObjectifContexte),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("objectif")
        .resolve("enregistrerBrouillonObjectifUseCase")
        .execute({
          chantierId: input.chantierId,
          type: input.type,
          contenu: input.contenu,
          auteurId: ctx.session.user.id,
          date: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  publierUnBrouillon: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationObjectifFormulaire)
        .merge(validationBrouillonObjectifAPublier),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("objectif")
        .resolve("publierBrouillonObjectifUseCase")
        .execute({
          brouillonId: input.brouillonId,
          contenu: input.contenu,
          auteurModificationId: ctx.session.user.id,
          dateModification: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  modifierLeBrouillon: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationObjectifFormulaire)
        .merge(validationBrouillonObjectifAPublier),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("objectif")
        .resolve("modifierBrouillonObjectifUseCase")
        .execute({
          brouillonId: input.brouillonId,
          contenu: input.contenu,
          auteurModificationId: ctx.session.user.id,
          dateModification: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  modifier: procédureProtégée
    .input(
      zodValidateurCSRF
        .merge(validationObjectifFormulaire)
        .merge(validationObjectifAModifier),
    )
    .mutation(({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      return getContainer("objectif")
        .resolve("modifierObjectifPublieUseCase")
        .execute({
          objectifId: input.objectifId,
          contenu: input.contenu,
          auteurModificationId: ctx.session.user.id,
          dateModification: new Date().toISOString(),
          habilitations: ctx.session.habilitations,
        });
    }),

  recupererHistorique: procédureProtégée
    .input(validationObjectifContexte)
    .query(({ input }) => {
      return getContainer("objectif")
        .resolve("recupererHistoriqueObjectifQuery")
        .run(input.chantierId, input.type);
    }),
});
