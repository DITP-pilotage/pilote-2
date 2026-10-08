import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import {
  validationPropositionValeurAvancement,
  validationAccepterPropositionValeurAvancement,
  validationRefuserPropositionValeurAvancement,
  validationSuppressionValeurAvancement,
  validationAccuserReceptionPropositionValeurAvancement,
  validationAccepterAvecModificationPropositionValeurAvancement,
} from "@/validation/proposition-valeur-avancement";
import { getContainer } from "@/server/dependances";

export const propositionValeurAvancementRouter = createTRPCRouter({
  creer: protectedProcedure
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
        propositionValeurAvancementChantierInformation,
      );

      await getContainer("indicateurTerritoireValeurEvenement")
        .resolve("creerPropositionValeurAvancementUseCase")
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

  modifier: protectedProcedure
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

  supprimer: protectedProcedure
    .input(validationSuppressionValeurAvancement)
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

  accepter: protectedProcedure
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

  accepterAvecModification: protectedProcedure
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

  refuser: protectedProcedure
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

  accuserReception: protectedProcedure
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
