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
import { zonegroupCommandSchema } from "@/server/metadataZonegroup/handlers/EnregistrerZonegroupHandler";

function vérifierPermissionAdmin(session: Session & { user: Session["user"] }) {
  const habilitation = new Habilitation({
    habilitations: session.habilitations,
    profil: session.profil,
  });
  if (!habilitation.estAutoriseAAccederALaPageAdmin()) {
    throw new Error("Accès non autorisé");
  }
}

export const metadataZonegroupRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataZonegroup")
      .resolve("listerZonegroupsAdminQuery")
      .run();
  }),

  récupérer: procédureProtégée
    .input(z.object({ zoneGroupId: z.string() }))
    .query(async ({ input, ctx }) => {
      vérifierPermissionAdmin(ctx.session);
      return getContainer("metadataZonegroup")
        .resolve("recupererZonegroupQuery")
        .run({ zoneGroupId: input.zoneGroupId });
    }),

  récupérerIdSuivant: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataZonegroup")
      .resolve("recupererIdSuivantZonegroupQuery")
      .run();
  }),

  listerZonesDisponibles: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataZonegroup")
      .resolve("listerZonesDisponiblesQuery")
      .run();
  }),

  enregistrer: procédureProtégée
    .input(zonegroupCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataZonegroup")
        .resolve("enregistrerZonegroupHandler")
        .execute(input);
    }),

  supprimer: procédureProtégée
    .input(
      z.object({ zoneGroupId: z.string(), restaurer: z.boolean().optional() }).and(zodValidateurCSRF),
    )
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataZonegroup")
        .resolve("supprimerZonegroupHandler")
        .execute({ zoneGroupId: input.zoneGroupId, restaurer: input.restaurer });
    }),
});
