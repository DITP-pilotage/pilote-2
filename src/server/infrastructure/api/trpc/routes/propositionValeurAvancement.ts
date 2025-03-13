import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import {
  validationPropositionValeurAvancement,
  validationSuppressionValeurActuelle,
} from '@/validation/proposition-valeur-actuelle';
import { StatutProposition } from '@/server/chantiers/domain/StatutProposition';
import Habilitation from '@/server/gestion-utilisateur/domain/habilitation/Habilitation';
import { getContainer } from '@/server/dependances';

export const propositionValeurAvancementRouter = créerRouteurTRPC({
  creer: procédureProtégée
    .input(validationPropositionValeurAvancement)
    .mutation(async ({ input, ctx }) => {
      const auteur = ctx.session.user.name ?? '';
      const idAuteur = ctx.session.user.id ?? '';

      const propositionValeurAvancementChantierInformation = await getContainer('chantiers').resolve('chantierRepository').recupererPropositionValeurAvancementChantierInformationParIndicId({ indicId: input.indicId });

      const habilitations = new Habilitation(ctx.session.habilitations);
      habilitations.verifierAutorisationModificationPropositionValeurAvancement(ctx.session.profil, ctx.session.habilitations.saisieCommentaire.chantiers, propositionValeurAvancementChantierInformation);

      await getContainer('chantiers').resolve('creerPropositionValeurActuelleUseCase').run({
        auteurModification: auteur,
        dateProposition: new Date(),
        dateValeurActuelle: new Date(input.dateValeurActuelle),
        idAuteurModification: idAuteur,
        indicId: input.indicId,
        territoireCode: input.territoireCode,
        valeurActuelleProposee: +(input.valeurActuelle.replace(',', '.')),
        motifProposition: input.motifProposition,
        sourceDonneeEtMethodeCalcul: input.sourceDonneeEtMethodeCalcul,
        statut: StatutProposition.EN_COURS,
      });
    }),
  supprimer: procédureProtégée
    .input(validationSuppressionValeurActuelle)
    .mutation(async ({ input, ctx }) => {
      const auteur = ctx.session.user.name ?? '';

      await getContainer('chantiers').resolve('modifierPropositionValeurActuelleUseCase').run({
        indicId: input.indicId,
        territoireCode: input.territoireCode,
        auteurModification: auteur,
      });
    }),
});
