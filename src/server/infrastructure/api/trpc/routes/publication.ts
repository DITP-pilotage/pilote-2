import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import { dependencies } from "@/server/infrastructure/Dependencies";
import CréerUnCommentaireUseCase from "@/server/usecase/chantier/commentaire/CréerUnCommentaireUseCase";
import {
  validationPublicationContexte,
  validationPublicationFormulaire,
  zodValidateurCSRF,
  zodValidateurEntité,
  zodValidateurEntitéType,
} from "validation/publication";
import RécupérerCommentaireLePlusRécentUseCase from "@/server/usecase/chantier/commentaire/RécupérerCommentaireLePlusRécentUseCase";
import RécupérerHistoriqueCommentaireUseCase from "@/server/usecase/chantier/commentaire/RécupérerHistoriqueCommentaireUseCase";
import CréerUnObjectifUseCase from "@/server/usecase/chantier/objectif/CréerUnObjectifUseCase";
import RécupérerObjectifLePlusRécentUseCase from "@/server/usecase/chantier/objectif/RécupérerObjectifLePlusRécentUseCase";
import RécupérerHistoriqueObjectifUseCase from "@/server/usecase/chantier/objectif/RécupérerHistoriqueObjectifUseCase";
import RécupérerDécisionStratégiqueLaPlusRécenteUseCase from "@/server/usecase/chantier/décision/RécupérerDécisionStratégiqueLaPlusRécenteUseCase";
import CréerUneDécisionStratégiqueUseCase from "@/server/usecase/chantier/décision/CréerUneDécisionStratégiqueUseCase";
import RécupérerHistoriqueDécisionStratégiqueUseCase from "@/server/usecase/chantier/décision/RécupérerHistoriqueDécisionStratégiqueUseCase";
import RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase from "@/server/usecase/chantier/commentaire/RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase";
import RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase from "@/server/usecase/chantier/objectif/RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase";
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
        const créerUnCommentaireUseCase = new CréerUnCommentaireUseCase(
          dependencies.getCommentaireRepository(),
        );
        return créerUnCommentaireUseCase.run(
          input.réformeId,
          input.territoireCode,
          input.contenu,
          auteur_id,
          input.type as TypeCommentaireChantier,
          ctx.session.habilitations,
        );
      }

      if (input.entité === "objectifs") {
        const créerUnObjectifUseCase = new CréerUnObjectifUseCase(
          dependencies.getObjectifRepository(),
        );
        return créerUnObjectifUseCase.run(
          input.réformeId,
          input.contenu,
          auteur_id,
          input.type as TypeObjectif,
          ctx.session.habilitations,
        );
      }

      if (input.entité === "décisions stratégiques") {
        const créerUneDécisionStratégiqueUseCase =
          new CréerUneDécisionStratégiqueUseCase(
            dependencies.getDécisionStratégiqueRepository(),
          );
        return créerUneDécisionStratégiqueUseCase.run(
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
        const récupérerCommentaireLePlusRécentUseCase =
          new RécupérerCommentaireLePlusRécentUseCase(
            dependencies.getCommentaireRepository(),
          );
        return récupérerCommentaireLePlusRécentUseCase.run(
          input.réformeId,
          input.territoireCode,
          input.type as TypeCommentaireChantier,
          ctx.session.habilitations,
        );
      }

      if (input.entité === "objectifs") {
        const récupérerObjectifLePlusRécentUseCase =
          new RécupérerObjectifLePlusRécentUseCase(
            dependencies.getObjectifRepository(),
          );
        return récupérerObjectifLePlusRécentUseCase.run(
          input.réformeId,
          input.type as TypeObjectif,
          ctx.session.habilitations,
        );
      }

      if (input.entité === "décisions stratégiques") {
        const récupérerDésionStratégiqueLaPlusRécenteUseCase =
          new RécupérerDécisionStratégiqueLaPlusRécenteUseCase(
            dependencies.getDécisionStratégiqueRepository(),
          );
        return récupérerDésionStratégiqueLaPlusRécenteUseCase.run(
          input.réformeId,
          ctx.session.habilitations,
        );
      }
    }),

  récupérerLesPlusRécentesParTypeGroupéesParRéformes: procédureProtégée
    .input(validationPublicationContexte.merge(zodValidateurEntité))
    .query(async ({ input, ctx }) => {
      if (input.entité === "commentaires") {
        const récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase =
          new RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase(
            dependencies.getCommentaireRepository(),
          );
        return récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase.run(
          [input.réformeId],
          input.territoireCode,
          ctx.session.habilitations,
        );
      }

      if (input.entité === "objectifs") {
        const récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase =
          new RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase(
            dependencies.getObjectifRepository(),
          );
        return récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase.run(
          [input.réformeId],
          ctx.session.habilitations,
        );
      }
    }),

  récupérerHistorique: procédureProtégée
    .input(validationPublicationContexte.and(zodValidateurEntitéType))
    .query(async ({ input, ctx }) => {
      if (input.entité === "commentaires") {
        const récupérerHistoriqueCommentaireUseCase =
          new RécupérerHistoriqueCommentaireUseCase(
            dependencies.getCommentaireRepository(),
          );
        return récupérerHistoriqueCommentaireUseCase.run(
          input.réformeId,
          input.territoireCode,
          input.type as TypeCommentaireChantier,
          ctx.session.habilitations,
        );
      }

      if (input.entité === "objectifs") {
        const récupérerHistoriqueObjectifUseCase =
          new RécupérerHistoriqueObjectifUseCase(
            dependencies.getObjectifRepository(),
          );
        return récupérerHistoriqueObjectifUseCase.run(
          input.réformeId,
          input.type as TypeObjectif,
          ctx.session.habilitations,
        );
      }

      if (input.entité === "décisions stratégiques") {
        const récupérerHistoriqueDésionStratégiqueUseCase =
          new RécupérerHistoriqueDécisionStratégiqueUseCase(
            dependencies.getDécisionStratégiqueRepository(),
          );
        return récupérerHistoriqueDésionStratégiqueUseCase.run(
          input.réformeId,
          ctx.session.habilitations,
        );
      }
    }),
});
