import { créerRouteurTRPC, procédureProtégée, vérifierSiLeCSRFEstValide } from '@/server/infrastructure/api/trpc/trpc';
import { validationFiltresPourListeUtilisateur, validationInfosBaseUtilisateur, validationInfosHabilitationsUtilisateur } from '@/validation/utilisateur';
import { zodValidateurCSRF } from '@/validation/publication';
import CréerOuMettreÀJourUnUtilisateurUseCase
  from '@/server/usecase/utilisateur/CréerOuMettreÀJourUnUtilisateurUseCase';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import RécupérerListeUtilisateursUseCase from '@/server/usecase/utilisateur/RécupérerListeUtilisateursUseCase';
import FiltrerListeUtilisateursUseCase from '@/server/usecase/utilisateur/FiltrerListeUtilisateursUseCase';

export const utilisateurRouter = créerRouteurTRPC({
  'créer' : procédureProtégée
    .input(validationInfosBaseUtilisateur.merge(zodValidateurCSRF).merge(validationInfosHabilitationsUtilisateur))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteurModification = ctx.session.user.name ?? '';
      await new CréerOuMettreÀJourUnUtilisateurUseCase().run(input, auteurModification);
    }),

  récupérerUtilisateursFiltrés: procédureProtégée
    .input(validationFiltresPourListeUtilisateur)
    .query(async ({ ctx, input }): Promise<Utilisateur[]> => {
      const tousLesUtilisateurs = await new RécupérerListeUtilisateursUseCase().run(ctx.session.habilitations);

      return new FiltrerListeUtilisateursUseCase(tousLesUtilisateurs, input.filtres).run();
    }),
});
