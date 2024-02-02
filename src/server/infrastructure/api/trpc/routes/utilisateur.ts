import { créerRouteurTRPC, procédureProtégée, vérifierSiLeCSRFEstValide } from '@/server/infrastructure/api/trpc/trpc';
import {
  validationFiltresPourListeUtilisateur,
  validationInfosBaseUtilisateur,
  validationInfosHabilitationsUtilisateur,
  validationSupprimerUtilisateur,
} from '@/validation/utilisateur';
import { zodValidateurCSRF } from '@/validation/publication';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import RécupérerListeUtilisateursUseCase from '@/server/usecase/utilisateur/RécupérerListeUtilisateursUseCase';
import FiltrerListeUtilisateursUseCase from '@/server/usecase/utilisateur/FiltrerListeUtilisateursUseCase';
import CréerOuMettreÀJourUnUtilisateurUseCase
  from '@/server/usecase/utilisateur/CréerOuMettreÀJourUnUtilisateurUseCase';
import SupprimerUnUtilisateurUseCase from '@/server/usecase/utilisateur/SupprimerUnUtilisateurUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';

export const utilisateurRouter = créerRouteurTRPC({
  'créer': procédureProtégée
    .input(validationInfosBaseUtilisateur.merge(zodValidateurCSRF).merge(validationInfosHabilitationsUtilisateur))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteurModification = ctx.session.user.name ?? '';
      await new CréerOuMettreÀJourUnUtilisateurUseCase(
        dependencies.getUtilisateurIAMRepository(),
        dependencies.getUtilisateurRepository(),
        dependencies.getTerritoireRepository(),
        dependencies.getChantierRepository(),
        dependencies.getPérimètreMinistérielRepository(),
        dependencies.getHistorisationModificationRepository(),
      ).run(input, auteurModification, false, ctx.session.habilitations);
    }),
  modifier: procédureProtégée
    .input(validationInfosBaseUtilisateur.merge(zodValidateurCSRF).merge(validationInfosHabilitationsUtilisateur))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteurModification = ctx.session.user.name ?? '';
      await new CréerOuMettreÀJourUnUtilisateurUseCase(
        dependencies.getUtilisateurIAMRepository(),
        dependencies.getUtilisateurRepository(),
        dependencies.getTerritoireRepository(),
        dependencies.getChantierRepository(),
        dependencies.getPérimètreMinistérielRepository(),
        dependencies.getHistorisationModificationRepository(),
      ).run(input, auteurModification, true, ctx.session.habilitations);
    }),
  supprimer: procédureProtégée
    .input(validationSupprimerUtilisateur.merge(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      await new SupprimerUnUtilisateurUseCase(
        dependencies.getUtilisateurRepository(),
        dependencies.getUtilisateurIAMRepository(),
      ).run(input.email, ctx.session.profil);
    }),
  récupérerUtilisateursFiltrés: procédureProtégée
    .input(validationFiltresPourListeUtilisateur)
    .query(async ({ ctx, input }): Promise<Utilisateur[]> => {
      const tousLesUtilisateurs = await new RécupérerListeUtilisateursUseCase(dependencies.getUtilisateurRepository()).run(ctx.session.habilitations);

      return new FiltrerListeUtilisateursUseCase(tousLesUtilisateurs, input.filtres).run();
    }),
});
