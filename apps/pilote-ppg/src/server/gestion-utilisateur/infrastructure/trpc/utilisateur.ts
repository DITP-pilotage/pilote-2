import { TRPCError } from "@trpc/server";
import { z } from "zod";
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
import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { profilsCodes } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";

const listInputSchema = z.object({
  territoires: z.array(z.string()),
  perimetresMinisteriels: z.array(z.string()),
  chantiers: z.array(z.string()),
  profils: z.array(z.enum(profilsCodes)),
  typeCompte: z.array(z.enum(["actif", "desactive"])),
  q: z.string(),
  sort: z.array(z.object({ id: z.string(), desc: z.boolean() })),
  page: z.number().int().min(0),
  pageSize: z.number().int().min(1).max(200),
});

const creerUtilisateurSchemaBase = validationInfosBaseUtilisateur.and(
  validationInfosHabilitationsUtilisateur,
);

export const utilisateurRouter = createTRPCRouter({
  list: protectedProcedure.input(listInputSchema).query(({ input, ctx }) => {
    const habilitation = new Habilitation(ctx.session.habilitations);
    if (!habilitation.peutConsulterLaListeDesUtilisateurs()) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const { q, sort, page, pageSize, ...filters } = input;
    return getContainer("gestionUtilisateur")
      .resolve("listUtilisateursPageUseCase")
      .run({
        filters,
        search: q,
        sorting: sort,
        page,
        pageSize,
        profil: ctx.session.profil,
        habilitation,
      });
  }),
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
