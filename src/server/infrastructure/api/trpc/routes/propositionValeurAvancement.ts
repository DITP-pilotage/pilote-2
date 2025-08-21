import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import {
  validationPropositionValeurAvancement,
  validationSuppressionValeurAvancement,
  validationAccepterPropositionValeurAvancement,
  validationRefuserPropositionValeurAvancement,
  validationSuppressionValeurAvancementV2,
  validationAccuserReceptionPropositionValeurAvancement,
  validationAccepterAvecModificationPropositionValeurAvancement,
} from "@/validation/proposition-valeur-avancement";
import { StatutProposition } from "@/server/chantiers/domain/StatutProposition";
import { getContainer } from "@/server/dependances";

export const propositionValeurAvancementRouter = créerRouteurTRPC({
  creer: procédureProtégée
    .input(validationPropositionValeurAvancement)
    .mutation(async ({ input, ctx }) => {
      const auteur = ctx.session.user.name ?? "";
      const idAuteur = ctx.session.user.id ?? "";

      const propositionValeurAvancementChantierInformation = await getContainer(
        "chantiers",
      )
        .resolve("chantierRepository")
        .recupererPropositionValeurAvancementChantierInformationParIndicId({
          indicId: input.indicId,
        });

      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);

      habilitations.verifierAutorisationModificationPropositionValeurAvancement(
        ctx.session.profil,
        ctx.session.habilitations.saisieCommentaire.chantiers,
        propositionValeurAvancementChantierInformation,
      );

      await getContainer("chantiers")
        .resolve("creerPropositionValeurAvancementUseCase")
        .run({
          auteurModification: auteur,
          dateProposition: new Date(),
          dateValeurAvancement: new Date(input.dateValeurAvancement),
          idAuteurModification: idAuteur,
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          valeurAvancementProposee: +input.valeurAvancement.replace(",", "."),
          motifProposition: input.motifProposition,
          sourceDonneeEtMethodeCalcul: input.sourceDonneeEtMethodeCalcul,
          statut: StatutProposition.EN_COURS,
        });
    }),

  creerV2: procédureProtégée
    .input(validationPropositionValeurAvancement)
    .mutation(async ({ input, ctx }) => {
      const idAuteur = ctx.session.user.id ?? "";

      const propositionValeurAvancementChantierInformation = await getContainer(
        "chantiers",
      )
        .resolve("chantierRepository")
        .recupererPropositionValeurAvancementChantierInformationParIndicId({
          indicId: input.indicId,
        });

      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);

      habilitations.verifierAutorisationModificationPropositionValeurAvancement(
        ctx.session.profil,
        ctx.session.habilitations.saisieCommentaire.chantiers,
        propositionValeurAvancementChantierInformation,
      );

      await getContainer("indicateurTerritoireValeurEvenement")
        .resolve("creerIndicateurTerritoireValeurEvenementUseCase")
        .run({
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          valeurAvancement: +input.valeurAvancement.replace(",", "."),
          dateValeurAvancement: new Date(input.dateValeurAvancement),
          idAuteurModification: idAuteur,
          motif: input.motifProposition,
          sourceDonneeEtMethodeCalcul: input.sourceDonneeEtMethodeCalcul,
        });
    }),

  modifier: procédureProtégée
    .input(validationPropositionValeurAvancement)
    .mutation(async ({ input, ctx }) => {
      const idAuteur = ctx.session.user.id ?? "";

      const propositionValeurAvancementChantierInformation = await getContainer(
        "chantiers",
      )
        .resolve("chantierRepository")
        .recupererPropositionValeurAvancementChantierInformationParIndicId({
          indicId: input.indicId,
        });

      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);

      habilitations.verifierAutorisationModificationPropositionValeurAvancement(
        ctx.session.profil,
        ctx.session.habilitations.saisieCommentaire.chantiers,
        propositionValeurAvancementChantierInformation,
      );

      await getContainer("indicateurTerritoireValeurEvenement")
        .resolve("modifierPropositionValeurAvancementUseCase")
        .run({
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          valeurAvancement: +input.valeurAvancement.replace(",", "."),
          dateValeurAvancement: new Date(input.dateValeurAvancement),
          idAuteurModification: idAuteur,
          motif: input.motifProposition,
          sourceDonneeEtMethodeCalcul: input.sourceDonneeEtMethodeCalcul,
        });
    }),

  supprimer: procédureProtégée
    .input(validationSuppressionValeurAvancement)
    .mutation(async ({ input, ctx }) => {
      const auteur = ctx.session.user.name ?? "";

      await getContainer("chantiers")
        .resolve("modifierPropositionValeurAvancementUseCase")
        .run({
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          auteurModification: auteur,
        });
    }),

  supprimerV2: procédureProtégée
    .input(validationSuppressionValeurAvancementV2)
    .mutation(async ({ input, ctx }) => {
      const auteur = ctx.session.user.id ?? "";

      await getContainer("indicateurTerritoireValeurEvenement")
        .resolve("supprimerPropositionValeurAvancementUseCase")
        .run({
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          dateValeurAvancement: new Date(input.dateValeurAvancement),
          idAuteurModification: auteur,
          motif: input.motif,
        });
    }),

  accepter: procédureProtégée
    .input(validationAccepterPropositionValeurAvancement)
    .mutation(async ({ input, ctx }) => {
      const auteur = ctx.session.user.id ?? "";

      const propositionValeurAvancementChantierInformation = await getContainer(
        "chantiers",
      )
        .resolve("chantierRepository")
        .recupererPropositionValeurAvancementChantierInformationParIndicId({
          indicId: input.indicId,
        });

      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);

      habilitations.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
        ctx.session.profil,
        ctx.session.habilitations,
        propositionValeurAvancementChantierInformation,
      );

      await getContainer("indicateurTerritoireValeurEvenement")
        .resolve("accepterPropositionValeurAvancementUseCase")
        .run({
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          idAuteurAcceptation: auteur,
          dateValeurAvancement: input.dateValeurAvancement,
          motif: input.motif,
        });
    }),

  accepterAvecModification: procédureProtégée
    .input(validationAccepterAvecModificationPropositionValeurAvancement)
    .mutation(async ({ input, ctx }) => {
      const auteur = ctx.session.user.id ?? "";

      const propositionValeurAvancementChantierInformation = await getContainer(
        "chantiers",
      )
        .resolve("chantierRepository")
        .recupererPropositionValeurAvancementChantierInformationParIndicId({
          indicId: input.indicId,
        });

      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);

      habilitations.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
        ctx.session.profil,
        ctx.session.habilitations,
        propositionValeurAvancementChantierInformation,
      );

      await getContainer("indicateurTerritoireValeurEvenement")
        .resolve("accepterAvecModificationPropositionValeurAvancementUseCase")
        .run({
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          idAuteurAcceptation: auteur,
          dateValeurAvancement: input.dateValeurAvancement,
          valeur: input.valeur,
          motif: input.motif,
        });
    }),

  refuser: procédureProtégée
    .input(validationRefuserPropositionValeurAvancement)
    .mutation(async ({ input, ctx }) => {
      const auteur = ctx.session.user.id ?? "";

      const propositionValeurAvancementChantierInformation = await getContainer(
        "chantiers",
      )
        .resolve("chantierRepository")
        .recupererPropositionValeurAvancementChantierInformationParIndicId({
          indicId: input.indicId,
        });

      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);

      habilitations.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
        ctx.session.profil,
        ctx.session.habilitations,
        propositionValeurAvancementChantierInformation,
      );

      await getContainer("indicateurTerritoireValeurEvenement")
        .resolve("refuserPropositionValeurAvancementUseCase")
        .run({
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          idAuteurRefus: auteur,
          dateValeurAvancement: input.dateValeurAvancement,
          motif: input.motif,
        });
    }),

  accuserReception: procédureProtégée
    .input(validationAccuserReceptionPropositionValeurAvancement)
    .mutation(async ({ input, ctx }) => {
      const auteur = ctx.session.user.id ?? "";

      const propositionValeurAvancementChantierInformation = await getContainer(
        "chantiers",
      )
        .resolve("chantierRepository")
        .recupererPropositionValeurAvancementChantierInformationParIndicId({
          indicId: input.indicId,
        });

      const habilitations = await getContainer("gestionUtilisateur")
        .resolve("habilitationService")
        .recupererHabilitations(ctx.session);

      habilitations.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
        ctx.session.profil,
        ctx.session.habilitations,
        propositionValeurAvancementChantierInformation,
      );

      await getContainer("indicateurTerritoireValeurEvenement")
        .resolve("accuserReceptionPropositionValeurUseCase")
        .run({
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          idAuteurAccuseReception: auteur,
          dateValeurAvancement: input.dateValeurAvancement,
          motif: input.motif,
        });
    }),
});
