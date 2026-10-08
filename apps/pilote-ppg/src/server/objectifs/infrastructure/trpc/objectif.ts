import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  checkCsrf,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import {
  validationObjectifContexte,
  validationObjectifFormulaire,
  validationBrouillonObjectifAPublier,
  validationObjectifAModifier,
} from "@/validation/objectif";

const zodValidateurCSRF = z.object({
  csrf: z.string(),
});

export const objectifRouter = createTRPCRouter({
  publier: protectedProcedure
    .input(
      zodValidateurCSRF
        .merge(validationObjectifFormulaire)
        .merge(validationObjectifContexte),
    )
    .mutation(({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);

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

  enregistrerEnBrouillon: protectedProcedure
    .input(
      zodValidateurCSRF
        .merge(validationObjectifFormulaire)
        .merge(validationObjectifContexte),
    )
    .mutation(({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);

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

  publierUnBrouillon: protectedProcedure
    .input(
      zodValidateurCSRF
        .merge(validationObjectifFormulaire)
        .merge(validationBrouillonObjectifAPublier),
    )
    .mutation(({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);

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

  modifierLeBrouillon: protectedProcedure
    .input(
      zodValidateurCSRF
        .merge(validationObjectifFormulaire)
        .merge(validationBrouillonObjectifAPublier),
    )
    .mutation(({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);

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

  modifier: protectedProcedure
    .input(
      zodValidateurCSRF
        .merge(validationObjectifFormulaire)
        .merge(validationObjectifAModifier),
    )
    .mutation(({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);

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

  recupererHistorique: protectedProcedure
    .input(validationObjectifContexte)
    .query(({ input, ctx }) => {
      new Habilitation(
        ctx.session.habilitations,
      ).vérifierLesHabilitationsEnLecture(input.chantierId, null);
      return getContainer("objectif")
        .resolve("recupererHistoriqueObjectifQuery")
        .run(input.chantierId, input.type);
    }),
});
