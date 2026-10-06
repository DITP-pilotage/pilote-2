import {
  createTRPCRouter,
  protectedProcedure,
  checkCsrf,
} from "@/server/framework/trpc/trpc";
import {
  validationDesactiverVideoAccueil,
  validationEnvoyerMailInscriptionInfolettre,
  validationInfosBaseUtilisateur,
  validationInfosHabilitationsUtilisateur,
  validationReactiverUtilisateur,
  validationSupprimerUtilisateur,
} from "@/validation/utilisateur";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";

const creerUtilisateurSchemaBase = validationInfosBaseUtilisateur.and(
  validationInfosHabilitationsUtilisateur,
);

export const utilisateurRouter = createTRPCRouter({
  creer: protectedProcedure
    .input(creerUtilisateurSchemaBase.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      const profilAuteur = await getContainer("gestionUtilisateur")
        .resolve("récupérerUnProfilUseCase")
        .run(ctx.session.profil);
      await getContainer("gestionUtilisateur")
        .resolve("créerOuMettreÀJourUnUtilisateurUseCase")
        .run(
          input,
          ctx.session.user.id,
          false,
          ctx.session.habilitations,
          profilAuteur,
        );
    }),
  modifier: protectedProcedure
    .input(creerUtilisateurSchemaBase.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      const profilAuteur = await getContainer("gestionUtilisateur")
        .resolve("récupérerUnProfilUseCase")
        .run(ctx.session.profil);
      await getContainer("gestionUtilisateur")
        .resolve("créerOuMettreÀJourUnUtilisateurUseCase")
        .run(
          input,
          ctx.session.user.id,
          true,
          ctx.session.habilitations,
          profilAuteur,
        );
    }),
  desactiver: protectedProcedure
    .input(validationSupprimerUtilisateur.merge(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      const profilAuteur = await getContainer("gestionUtilisateur")
        .resolve("récupérerUnProfilUseCase")
        .run(ctx.session.profil);
      await getContainer("gestionUtilisateur")
        .resolve("desactiverUnUtilisateurUseCase")
        .run(
          input.email,
          ctx.session.habilitations,
          profilAuteur,
          ctx.session.user.id,
        );
    }),
  reactiver: protectedProcedure
    .input(validationReactiverUtilisateur.merge(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      const profilAuteur = await getContainer("gestionUtilisateur")
        .resolve("récupérerUnProfilUseCase")
        .run(ctx.session.profil);
      await getContainer("gestionUtilisateur")
        .resolve("reactiverUnUtilisateurUseCase")
        .run(
          input.email,
          ctx.session.habilitations,
          profilAuteur,
          ctx.session.user.id,
        );
    }),
  desactiverVideoAccueil: protectedProcedure
    .input(validationDesactiverVideoAccueil.merge(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      await getContainer("gestionUtilisateur")
        .resolve("desactiverVideoAccueilUseCase")
        .execute(input.utilisateurId);
    }),
  envoyerMailInscriptionInfolettre: protectedProcedure
    .input(validationEnvoyerMailInscriptionInfolettre.merge(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      await getContainer("gestionUtilisateur")
        .resolve("envoyerMailInscriptionInfolettreUseCase")
        .execute(input.utilisateurEmail, input.lienConfirmationInscription);
    }),
  desactiverPopupInfolettre: protectedProcedure
    .input(validationDesactiverVideoAccueil.merge(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      checkCsrf(ctx.csrfDuCookie, input.csrf);
      await getContainer("gestionUtilisateur")
        .resolve("desactiverPopupInfolettreUseCase")
        .execute(input.utilisateurId);
    }),
});
