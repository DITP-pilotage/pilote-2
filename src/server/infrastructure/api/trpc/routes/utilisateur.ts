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
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import RécupérerUnProfilUseCase from '@/server/usecase/profil/RécupérerUnProfilUseCase';

export const utilisateurRouter = créerRouteurTRPC({
  'créer': procédureProtégée
    .input(validationInfosBaseUtilisateur.merge(zodValidateurCSRF).merge(validationInfosHabilitationsUtilisateur))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteurModification = ctx.session.user.name ?? '';
      const profilAuteur = await new RécupérerUnProfilUseCase(
        dependencies.getProfilRepository(),
      ).run(ctx.session.profil);
      await new CréerOuMettreÀJourUnUtilisateurUseCase(
        dependencies.getUtilisateurIAMRepository(),
        dependencies.getUtilisateurRepository(),
        dependencies.getTerritoireRepository(),
        dependencies.getChantierRepository(),
        dependencies.getPérimètreMinistérielRepository(),
        dependencies.getHistorisationModificationRepository(),
      ).run(input, auteurModification, false, ctx.session.habilitations, profilAuteur);
    }),
  modifier: procédureProtégée
    .input(validationInfosBaseUtilisateur.merge(zodValidateurCSRF).merge(validationInfosHabilitationsUtilisateur))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteurModification = ctx.session.user.name ?? '';
      const profilAuteur = await new RécupérerUnProfilUseCase(
        dependencies.getProfilRepository(),
      ).run(ctx.session.profil);
      await new CréerOuMettreÀJourUnUtilisateurUseCase(
        dependencies.getUtilisateurIAMRepository(),
        dependencies.getUtilisateurRepository(),
        dependencies.getTerritoireRepository(),
        dependencies.getChantierRepository(),
        dependencies.getPérimètreMinistérielRepository(),
        dependencies.getHistorisationModificationRepository(),
      ).run(input, auteurModification, true, ctx.session.habilitations, profilAuteur);
    }),
  supprimer: procédureProtégée
    .input(validationSupprimerUtilisateur.merge(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const profilAuteur = await new RécupérerUnProfilUseCase(
        dependencies.getProfilRepository(),
      ).run(ctx.session.profil);
      await new SupprimerUnUtilisateurUseCase(
        dependencies.getUtilisateurRepository(),
        dependencies.getUtilisateurIAMRepository(),
      ).run(input.email, ctx.session.habilitations, profilAuteur);
    }),
  récupérerUtilisateursFiltrés: procédureProtégée
    .input(validationFiltresPourListeUtilisateur)
    .query(async ({ ctx, input }): Promise<Utilisateur[]> => {
      const tousLesUtilisateurs = await new RécupérerListeUtilisateursUseCase(dependencies.getUtilisateurRepository()).run(ctx.session.habilitations);
      const habilitation = new Habilitation(ctx.session.habilitations);
      return new FiltrerListeUtilisateursUseCase(tousLesUtilisateurs, input.filtres, ctx.session.profil, habilitation).run();
    }),
});
