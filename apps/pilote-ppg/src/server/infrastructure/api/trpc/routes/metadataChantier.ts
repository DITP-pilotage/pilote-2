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
import { chantierCommandSchema } from "@/server/metadataChantier/handlers/EnregistrerChantierHandler";
import { ForbiddenError } from "@/server/app/error-boundary/forbidden-error";

function vérifierPermissionAdmin(session: Session & { user: Session["user"] }) {
  const habilitation = new Habilitation({
    habilitations: session.habilitations,
    profil: session.profil,
  });
  if (!habilitation.estAutoriseAAccederALaPageAdmin()) {
    throw new ForbiddenError("Accès non autorisé");
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

  listerPorteursMinistere: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataChantier")
      .resolve("listerPorteursQuery")
      .run({ type: "MIN" });
  }),

  listerPorteursDAC: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    return getContainer("metadataChantier")
      .resolve("listerPorteursQuery")
      .run({ type: "DAC" });
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

  enregistrer: procédureProtégée
    .input(chantierCommandSchema.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await getContainer("metadataChantier")
        .resolve("enregistrerChantierHandler")
        .execute(input);
    }),
});
