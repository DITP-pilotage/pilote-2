import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { getContainer } from "@/server/dependances";
import { chantierCommandSchema } from "@/server/metadataChantier/handlers/EnregistrerChantierHandler";
import { vérifierPermissionAdmin } from "@/server/infrastructure/api/trpc/vérifierPermissionAdmin";

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
