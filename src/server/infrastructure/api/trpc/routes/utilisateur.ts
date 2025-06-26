import { créerRouteurTRPC, procédureProtégée, vérifierSiLeCSRFEstValide } from '@/server/infrastructure/api/trpc/trpc';
import {
  validationDesactiverVideoAccueil,
  validationInfosBaseUtilisateur,
  validationInfosHabilitationsUtilisateur,
  validationReactiverUtilisateur,
  validationSupprimerUtilisateur,
} from '@/validation/utilisateur';
import { zodValidateurCSRF } from '@/validation/publication';
import { dependencies } from '@/server/infrastructure/Dependencies';
import RécupérerUnProfilUseCase from '@/server/usecase/profil/RécupérerUnProfilUseCase';
import { getContainer } from '@/server/dependances';

export const utilisateurRouter = créerRouteurTRPC({
  'créer': procédureProtégée
    .input(validationInfosBaseUtilisateur.merge(zodValidateurCSRF).merge(validationInfosHabilitationsUtilisateur))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const profilAuteur = await new RécupérerUnProfilUseCase(
        dependencies.getProfilRepository(),
      ).run(ctx.session.profil);
      await getContainer('gestionUtilisateur')
        .resolve('créerOuMettreÀJourUnUtilisateurUseCase')
        .run(input, ctx.session.user.id, false, ctx.session.habilitations, profilAuteur);
    }),
  modifier: procédureProtégée
    .input(validationInfosBaseUtilisateur.merge(zodValidateurCSRF).merge(validationInfosHabilitationsUtilisateur))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const profilAuteur = await new RécupérerUnProfilUseCase(
        dependencies.getProfilRepository(),
      ).run(ctx.session.profil);
      await getContainer('gestionUtilisateur')
        .resolve('créerOuMettreÀJourUnUtilisateurUseCase')
        .run(input, ctx.session.user.id, true, ctx.session.habilitations, profilAuteur);
    }),
  desactiver: procédureProtégée
    .input(validationSupprimerUtilisateur.merge(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const profilAuteur = await new RécupérerUnProfilUseCase(
        dependencies.getProfilRepository(),
      ).run(ctx.session.profil);
      await getContainer('gestionUtilisateur').resolve('desactiverUnUtilisateurUseCase').run(input.email, ctx.session.habilitations, profilAuteur, ctx.session.user.id);
    }),
  reactiver: procédureProtégée
    .input(validationReactiverUtilisateur.merge(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const profilAuteur = await new RécupérerUnProfilUseCase(
        dependencies.getProfilRepository(),
      ).run(ctx.session.profil);
      await getContainer('gestionUtilisateur').resolve('reactiverUnUtilisateurUseCase').run(input.email, ctx.session.habilitations, profilAuteur, ctx.session.user.id);
    }),
  desactiverVideoAccueil: procédureProtégée
    .input(validationDesactiverVideoAccueil.merge(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      await getContainer('gestionUtilisateur').resolve('desactiverVideoAccueilUseCase').execute(input.utilisateurId);
    }),
});
