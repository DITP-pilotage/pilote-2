import { créerRouteurTRPC, procédureProtégée, vérifierSiLeCSRFEstValide } from '@/server/infrastructure/api/trpc/trpc';
import { validationInfosBaseUtilisateur, validationInfosHabilitationsUtilisateur } from '@/validation/utilisateur';
import { zodValidateurCSRF } from '@/validation/publication';
import CréerOuMettreÀJourUnUtilisateurUseCase
  from '@/server/usecase/utilisateur/CréerOuMettreÀJourUnUtilisateurUseCase';

export const utilisateurRouter = créerRouteurTRPC({
  'créer' : procédureProtégée
    .input(validationInfosBaseUtilisateur.merge(zodValidateurCSRF).merge(validationInfosHabilitationsUtilisateur))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteurModification = ctx.session.user.name ?? '';
      await new CréerOuMettreÀJourUnUtilisateurUseCase().run(input, auteurModification);
    }),
});
