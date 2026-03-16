import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";
import {
  validationPublicationContexte,
  validationPublicationFormulaire,
  zodValidateurCSRF,
  zodValidateurEntité,
  zodValidateurEntitéType,
} from "validation/publication";
import { TypeObjectif } from "@/server/domain/chantier/objectif/Objectif.interface";

export const publicationRouter = créerRouteurTRPC({
  créer: procédureProtégée
    .input(
      validationPublicationContexte
        .merge(zodValidateurCSRF)
        .and(validationPublicationFormulaire),
    )
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteur_id = ctx.session.user.id;

      if (input.entité === "objectifs") {
        return getContainer("legacy")
          .resolve("créerUnObjectifUseCase")
          .run(
            input.réformeId,
            input.contenu,
            auteur_id,
            input.type as TypeObjectif,
            ctx.session.habilitations,
          );
      }
    }),

  récupérerLaPlusRécente: procédureProtégée
    .input(validationPublicationContexte.and(zodValidateurEntitéType))
    .query(async ({ input, ctx }) => {
      if (input.entité === "objectifs") {
        return getContainer("legacy")
          .resolve("récupérerObjectifLePlusRécentUseCase")
          .run(
            input.réformeId,
            input.type as TypeObjectif,
            ctx.session.habilitations,
          );
      }
    }),

  récupérerLesPlusRécentesParTypeGroupéesParRéformes: procédureProtégée
    .input(validationPublicationContexte.merge(zodValidateurEntité))
    .query(async ({ input, ctx }) => {
      if (input.entité === "objectifs") {
        return getContainer("legacy")
          .resolve(
            "récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase",
          )
          .run([input.réformeId], ctx.session.habilitations);
      }
    }),

  récupérerHistorique: procédureProtégée
    .input(validationPublicationContexte.and(zodValidateurEntitéType))
    .query(async ({ input, ctx }) => {
      if (input.entité === "objectifs") {
        return getContainer("legacy")
          .resolve("récupérerHistoriqueObjectifUseCase")
          .run(
            input.réformeId,
            input.type as TypeObjectif,
            ctx.session.habilitations,
          );
      }
    }),
});
