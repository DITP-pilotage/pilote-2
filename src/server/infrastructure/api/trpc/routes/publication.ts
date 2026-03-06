import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import { dependencies } from "@/server/infrastructure/Dependencies";
import {
  validationPublicationContexte,
  validationPublicationFormulaire,
  zodValidateurCSRF,
  zodValidateurEntité,
  zodValidateurEntitéType,
} from "validation/publication";
import CréerUnObjectifUseCase from "@/server/usecase/chantier/objectif/CréerUnObjectifUseCase";
import RécupérerObjectifLePlusRécentUseCase from "@/server/usecase/chantier/objectif/RécupérerObjectifLePlusRécentUseCase";
import RécupérerHistoriqueObjectifUseCase from "@/server/usecase/chantier/objectif/RécupérerHistoriqueObjectifUseCase";
import RécupérerDécisionStratégiqueLaPlusRécenteUseCase from "@/server/usecase/chantier/décision/RécupérerDécisionStratégiqueLaPlusRécenteUseCase";
import CréerUneDécisionStratégiqueUseCase from "@/server/usecase/chantier/décision/CréerUneDécisionStratégiqueUseCase";
import RécupérerHistoriqueDécisionStratégiqueUseCase from "@/server/usecase/chantier/décision/RécupérerHistoriqueDécisionStratégiqueUseCase";
import RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase from "@/server/usecase/chantier/objectif/RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase";
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
