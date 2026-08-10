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
import { modifierChantierCommandSchema } from "@/server/metadataChantier/handlers/ModifierChantierHandler";
import { creerChantierCommandSchema } from "@/server/metadataChantier/handlers/CreerChantierHandler";

function vérifierPermissionAdmin(session: Session & { user: Session["user"] }) {
  const habilitation = new Habilitation({
    habilitations: session.habilitations,
    profil: session.profil,
  });
  if (!habilitation.estAutoriseAAccederALaPageAdmin()) {
    throw new Error("Accès non autorisé");
  }
}

export const metadataChantierRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataChantier")
      .resolve("listerChantiersQuery")
      .run();
  }),

  récupérer: procédureProtégée
    .input(z.object({ chantierId: z.string() }))
    .query(async ({ input, ctx }) => {
      vérifierPermissionAdmin(ctx.session);
      return getContainer("metadataChantier")
        .resolve("recupererChantierQuery")
        .run({ chantierId: input.chantierId });
    }),

  récupérerIdSuivant: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataChantier")
      .resolve("recupererIdSuivantQuery")
      .run();
  }),

  listerPpgs: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataChantier").resolve("listerPpgsQuery").run();
  }),

  listerPorteursMIN: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataChantier")
      .resolve("listerPorteursMinQuery")
      .run();
  }),

  listerPorteursDAC: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataChantier")
      .resolve("listerPorteursDacQuery")
      .run();
  }),

  listerPerimetres: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataChantier")
      .resolve("listerPerimetresQuery")
      .run();
  }),

  listerZonegroups: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataChantier")
      .resolve("listerZonegroupsQuery")
      .run();
  }),

  modifier: procédureProtégée
    .input(modifierChantierCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataChantier")
        .resolve("modifierChantierHandler")
        .execute(input);
    }),

  creer: procédureProtégée
    .input(creerChantierCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataChantier")
        .resolve("creerChantierHandler")
        .execute(input);
    }),
});
