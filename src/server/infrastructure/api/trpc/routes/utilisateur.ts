import { créerRouteurTRPC, procédureProtégée, vérifierSiLeCSRFEstValide } from '@/server/infrastructure/api/trpc/trpc';
import {
  validationFiltresPourListeUtilisateurNew,
  validationInfosBaseUtilisateur,
  validationInfosHabilitationsUtilisateur,
  validationSupprimerUtilisateur,
} from '@/validation/utilisateur';
import { zodValidateurCSRF } from '@/validation/publication';
import CréerOuMettreÀJourUnUtilisateurUseCase
  from '@/server/gestion-utilisateur/usecases/CréerOuMettreÀJourUnUtilisateurUseCase';
import SupprimerUnUtilisateurUseCase from '@/server/gestion-utilisateur/usecases/SupprimerUnUtilisateurUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import RécupérerUnProfilUseCase from '@/server/usecase/profil/RécupérerUnProfilUseCase';
import {
  presenterEnUtilisateurListeGestionContrat,
  UtilisateurListeGestionContrat,
} from '@/server/app/contrats/UtilisateurListeGestionContrat';
import { RecupererTousLesTerritoiresUseCase } from '@/server/usecase/territoire/RecupererTousLesTerritoiresUseCase';
import RécupérerListeUtilisateursUseCaseNew
  from '@/server/gestion-utilisateur/usecases/RécupérerListeUtilisateursUseCaseNew';
import FiltrerListeUtilisateursUseCaseNew
  from '@/server/gestion-utilisateur/usecases/FiltrerListeUtilisateursUseCaseNew';
import { getContainer } from '@/server/dependances';
import { UtilisateurIAMKeycloakRepository } from '@/server/gestion-utilisateur/infrastructure/adapters/UtilisateurIAMKeycloakRepository';

export const utilisateurRouter = créerRouteurTRPC({
  'créer': procédureProtégée
    .input(validationInfosBaseUtilisateur.merge(zodValidateurCSRF).merge(validationInfosHabilitationsUtilisateur))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteurModification = ctx.session.user.email ?? '';
      const profilAuteur = await new RécupérerUnProfilUseCase(
        dependencies.getProfilRepository(),
      ).run(ctx.session.profil);
      await new CréerOuMettreÀJourUnUtilisateurUseCase(
        new UtilisateurIAMKeycloakRepository(),
        dependencies.getUtilisateurRepository(),
        dependencies.getTerritoireRepository(),
        dependencies.getChantierRepository(),
        dependencies.getPérimètreMinistérielRepository(),
        dependencies.getHistorisationModificationRepository(),
      ).run(input, auteurModification, ctx.session.user.id, false, ctx.session.habilitations, profilAuteur);
    }),
  modifier: procédureProtégée
    .input(validationInfosBaseUtilisateur.merge(zodValidateurCSRF).merge(validationInfosHabilitationsUtilisateur))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const auteurModification = ctx.session.user.email ?? '';
      const profilAuteur = await new RécupérerUnProfilUseCase(
        dependencies.getProfilRepository(),
      ).run(ctx.session.profil);
      await new CréerOuMettreÀJourUnUtilisateurUseCase(
        new UtilisateurIAMKeycloakRepository(),
        dependencies.getUtilisateurRepository(),
        dependencies.getTerritoireRepository(),
        dependencies.getChantierRepository(),
        dependencies.getPérimètreMinistérielRepository(),
        dependencies.getHistorisationModificationRepository(),
      ).run(input, auteurModification, ctx.session.user.id, true, ctx.session.habilitations, profilAuteur);
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
        new UtilisateurIAMKeycloakRepository(),
      ).run(input.email, ctx.session.habilitations, profilAuteur);
    }),
  desactiver: procédureProtégée
    .input(validationSupprimerUtilisateur.merge(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      const profilAuteur = await new RécupérerUnProfilUseCase(
        dependencies.getProfilRepository(),
      ).run(ctx.session.profil);
      await getContainer('gestionUtilisateur').resolve('desactiverUnUtilisateurUseCase').run(input.email, ctx.session.habilitations, profilAuteur);
    }),
  récupérerUtilisateursFiltrésNew: procédureProtégée
    .input(validationFiltresPourListeUtilisateurNew)
    .query(async ({ ctx, input }): Promise<{ count: number, utilisateurs: UtilisateurListeGestionContrat[] }> => {
      const [tousLesUtilisateurs, territoiresListe] = await Promise.all([
        new RécupérerListeUtilisateursUseCaseNew(dependencies.getUtilisateurRepository()).run({ sorting: input.sorting, valeurDeLaRecherche: input.valeurDeLaRecherche }),
        new RecupererTousLesTerritoiresUseCase({ territoireRepository: dependencies.getTerritoireRepository() }).run(),
      ]);
      const habilitation = new Habilitation(ctx.session.habilitations);
      const utilisateursFiltrés = new FiltrerListeUtilisateursUseCaseNew(tousLesUtilisateurs, input.filtres, ctx.session.profil, habilitation).run();
      return { count: utilisateursFiltrés.length, utilisateurs: utilisateursFiltrés.splice((input.pagination.pageIndex - 1) * input.pagination.pageSize, input.pagination.pageSize).map(utilisateur => presenterEnUtilisateurListeGestionContrat(utilisateur, territoiresListe)) };
    }),
});
