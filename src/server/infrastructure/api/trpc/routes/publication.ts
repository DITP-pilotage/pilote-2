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
import { TypeCommentaireChantier } from "@/server/domain/chantier/commentaire/Commentaire.interface";

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

      if (input.entité === "commentaires") {
        return getContainer("legacy")
          .resolve("créerUnCommentaireUseCase")
          .run(
            input.réformeId,
            input.territoireCode,
            input.contenu,
            auteur_id,
            input.type as TypeCommentaireChantier,
            ctx.session.habilitations,
          );
      }

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

      if (input.entité === "décisions stratégiques") {
        return getContainer("legacy")
          .resolve("créerUneDécisionStratégiqueUseCase")
          .run(
            input.réformeId,
            input.contenu,
            auteur_id,
            ctx.session.habilitations,
          );
      }
    }),

  récupérerLaPlusRécente: procédureProtégée
    .input(validationPublicationContexte.and(zodValidateurEntitéType))
    .query(async ({ input, ctx }) => {
      if (input.entité === "commentaires") {
        return getContainer("legacy")
          .resolve("récupérerCommentaireLePlusRécentUseCase")
          .run(
            input.réformeId,
            input.territoireCode,
            input.type as TypeCommentaireChantier,
            ctx.session.habilitations,
          );
      }

      if (input.entité === "objectifs") {
        return getContainer("legacy")
          .resolve("récupérerObjectifLePlusRécentUseCase")
          .run(
            input.réformeId,
            input.type as TypeObjectif,
            ctx.session.habilitations,
          );
      }

      if (input.entité === "décisions stratégiques") {
        return getContainer("legacy")
          .resolve("récupérerDécisionStratégiqueLaPlusRécenteUseCase")
          .run(input.réformeId, ctx.session.habilitations);
      }
    }),

  récupérerLesPlusRécentesParTypeGroupéesParRéformes: procédureProtégée
    .input(validationPublicationContexte.merge(zodValidateurEntité))
    .query(async ({ input, ctx }) => {
      if (input.entité === "commentaires") {
        return getContainer("legacy")
          .resolve(
            "récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase",
          )
          .run(
            [input.réformeId],
            input.territoireCode,
            ctx.session.habilitations,
          );
      }

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
      if (input.entité === "commentaires") {
        return getContainer("legacy")
          .resolve("récupérerHistoriqueCommentaireUseCase")
          .run(
            input.réformeId,
            input.territoireCode,
            input.type as TypeCommentaireChantier,
            ctx.session.habilitations,
          );
      }

      if (input.entité === "objectifs") {
        return getContainer("legacy")
          .resolve("récupérerHistoriqueObjectifUseCase")
          .run(
            input.réformeId,
            input.type as TypeObjectif,
            ctx.session.habilitations,
          );
      }

      if (input.entité === "décisions stratégiques") {
        return getContainer("legacy")
          .resolve("récupérerHistoriqueDécisionStratégiqueUseCase")
          .run(input.réformeId, ctx.session.habilitations);
      }
    }),
});
