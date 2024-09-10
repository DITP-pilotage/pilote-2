import { créerRouteurTRPC, procédureProtégée, vérifierSiLeCSRFEstValide } from '@/server/infrastructure/api/trpc/trpc';
import {
  validationFiltresPourListeUtilisateur,
  validationInfosBaseUtilisateur,
  validationInfosHabilitationsUtilisateur,
  validationSupprimerUtilisateur,
} from '@/validation/utilisateur';
import { zodValidateurCSRF } from '@/validation/publication';
import RécupérerListeUtilisateursUseCase from '@/server/gestion-utilisateur/usecases/RécupérerListeUtilisateursUseCase';
import FiltrerListeUtilisateursUseCase from '@/server/gestion-utilisateur/usecases/FiltrerListeUtilisateursUseCase';
import CréerOuMettreÀJourUnUtilisateurUseCase
  from '@/server/gestion-utilisateur/usecases/CréerOuMettreÀJourUnUtilisateurUseCase';
import SupprimerUnUtilisateurUseCase from '@/server/gestion-utilisateur/usecases/SupprimerUnUtilisateurUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import RécupérerUnProfilUseCase from '@/server/usecase/profil/RécupérerUnProfilUseCase';
import { RecupererTousLesTerritoiresUseCase } from '@/server/usecase/territoire/RecupererTousLesTerritoiresUseCase';
import {
  presenterEnUtilisateurContrat,
  UtilisateurContrat,
} from '@/server/gestion-utilisateur/app/contrats/UtilisateurContrat';

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
      const auteurModification = ctx.session.user.email ?? '';
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
    .query(async ({ ctx, input }): Promise<UtilisateurContrat[]> => {
      const tousLesUtilisateurs = await new RécupérerListeUtilisateursUseCase(dependencies.getUtilisateurRepository()).run(ctx.session.habilitations);
      const habilitation = new Habilitation(ctx.session.habilitations);
      const utilisateursFiltres = new FiltrerListeUtilisateursUseCase(tousLesUtilisateurs, input.filtres, ctx.session.profil, habilitation).run();
      const territoiresListe = await new RecupererTousLesTerritoiresUseCase({ territoireRepository: dependencies.getTerritoireRepository() }).run();
      return utilisateursFiltres.map(utilisateur => presenterEnUtilisateurContrat(utilisateur, territoiresListe));
    }),
});
