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
import { perimetreCommandSchema } from "@/server/metadataPerimetre/handlers/EnregistrerPerimetreHandler";

function vérifierPermissionAdmin(session: Session & { user: Session["user"] }) {
  const habilitation = new Habilitation({
    habilitations: session.habilitations,
    profil: session.profil,
  });
  if (!habilitation.estAutoriseAAccederALaPageAdmin()) {
    throw new Error("Accès non autorisé");
  }
}

export const metadataPerimetreRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataPerimetre")
      .resolve("listerPerimetresAdminQuery")
      .run();
  }),

  récupérer: procédureProtégée
    .input(z.object({ perimetreId: z.string() }))
    .query(async ({ input, ctx }) => {
      vérifierPermissionAdmin(ctx.session);
      return getContainer("metadataPerimetre")
        .resolve("recupererPerimetreQuery")
        .run({ perimetreId: input.perimetreId });
    }),

  récupérerIdSuivant: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataPerimetre")
      .resolve("recupererIdSuivantPerimetreQuery")
      .run();
  }),

  enregistrer: procédureProtégée
    .input(perimetreCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataPerimetre")
        .resolve("enregistrerPerimetreHandler")
        .execute(input);
    }),

  supprimer: procédureProtégée
    .input(
      z.object({ perimetreId: z.string(), restaurer: z.boolean().optional() }).and(zodValidateurCSRF),
    )
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataPerimetre")
        .resolve("supprimerPerimetreHandler")
        .execute({ perimetreId: input.perimetreId, restaurer: input.restaurer });
    }),
});
