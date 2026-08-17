import { z } from "zod";
import { Session } from "next-auth";
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { porteurCommandSchema } from "@/server/metadataPorteur/handlers/EnregistrerPorteurHandler";

function vérifierPermissionAdmin(session: Session & { user: Session["user"] }) {
  const habilitation = new Habilitation({
    habilitations: session.habilitations,
    profil: session.profil,
  });
  if (!habilitation.estAutoriseAAccederALaPageAdmin()) {
    throw new Error("Accès non autorisé");
  }
}

export const metadataPorteurRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataPorteur")
      .resolve("listerPorteursAdminQuery")
      .run();
  }),

  récupérer: procédureProtégée
    .input(z.object({ porteurId: z.string() }))
    .query(async ({ input, ctx }) => {
      vérifierPermissionAdmin(ctx.session);
      return getContainer("metadataPorteur")
        .resolve("recupererPorteurQuery")
        .run({ porteurId: input.porteurId });
    }),

  récupérerIdSuivant: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataPorteur")
      .resolve("recupererIdSuivantPorteurQuery")
      .run();
  }),

  enregistrer: procédureProtégée
    .input(porteurCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataPorteur")
        .resolve("enregistrerPorteurHandler")
        .execute(input);
    }),

  supprimer: procédureProtégée
    .input(
      z.object({ porteurId: z.string(), restaurer: z.boolean().optional() }).and(zodValidateurCSRF),
    )
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataPorteur")
        .resolve("supprimerPorteurHandler")
        .execute({ porteurId: input.porteurId, restaurer: input.restaurer });
    }),
});
