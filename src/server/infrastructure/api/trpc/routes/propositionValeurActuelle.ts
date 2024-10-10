import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { validationPropositionValeurActuelle } from '@/validation/proposition-valeur-actuelle';
import {
  CreerPropositionValeurActuelleUseCase,
} from '@/server/chantiers/usecases/CreerPropositionValeurActuelleUseCase';
import { StatutProposition } from '@/server/chantiers/domain/StatutProposition';

export const propositionValeurActuelleRouter = créerRouteurTRPC({
  creer: procédureProtégée
    .input(validationPropositionValeurActuelle)
    .mutation(async ({ input, ctx }) => {
      const auteur = ctx.session.user.name ?? '';
      const idAuteur = ctx.session.user.id ?? '';

      return new CreerPropositionValeurActuelleUseCase({
        propositionValeurActuelleRepository: dependencies.getPropositionValeurActuelleRepository(),
      }).run({
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
});
