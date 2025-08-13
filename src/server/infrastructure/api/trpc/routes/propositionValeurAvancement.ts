import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import {
  validationPropositionValeurAvancement,
  validationSuppressionValeurAvancement,
} from "@/validation/proposition-valeur-avancement";
import { StatutProposition } from "@/server/chantiers/domain/StatutProposition";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
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

      const habilitations = new Habilitation(ctx.session.habilitations);

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

      const habilitations = new Habilitation(ctx.session.habilitations);

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
});
