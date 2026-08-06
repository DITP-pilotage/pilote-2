import { z } from "zod";
import { $Enums } from "@prisma/client";
import { Session } from "next-auth";
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import { zodValidateurCSRF } from "@/validation/publication";
import { prisma } from "@/server/db/prisma";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import {
  presenterEnMetadataChantierContrat,
  presenterEnOptionsChantierContrat,
} from "@/server/app/contrats/MetadataChantierContrat";

const MAILLES = ["NAT", "REG", "DEPT"] as const;

const validationChantierInput = z.object({
  chantierId: z.string().regex(/^CH-\d{3}$/),
  chNom: z.string().min(1).max(500),
  chDescr: z.string().nullable(),
  chPpg: z.string(),
  chTerrito: z.boolean(),
  chHiddenPilote: z.boolean(),
  chSaisieAte: z.nativeEnum($Enums.type_ate).nullable(),
  chState: z.nativeEnum($Enums.type_statut),
  zgApplicable: z.string().nullable(),
  porteurIdsNoDAC: z.array(z.string()),
  porteurIdsDAC: z.array(z.string()),
  chPer: z.string(),
  mailleApplicable: z
    .array(z.enum(MAILLES))
    .min(1, "Au moins une maille est requise"),
  chCibleAttendue: z.boolean(),
  conseillerMail: z.string().email().nullable().or(z.literal("")),
});

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
    const chantiers = await prisma.metadata_chantiers.findMany({
      orderBy: { chantier_id: "asc" },
    });
    return chantiers.map(presenterEnMetadataChantierContrat);
  }),

  récupérer: procédureProtégée
    .input(z.object({ chantierId: z.string() }))
    .query(async ({ input, ctx }) => {
      vérifierPermissionAdmin(ctx.session);
      const chantier = await prisma.metadata_chantiers.findUniqueOrThrow({
        where: { chantier_id: input.chantierId },
      });
      return presenterEnMetadataChantierContrat(chantier);
    }),

  récupérerIdSuivant: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    const dernierChantier = await prisma.metadata_chantiers.findFirst({
      orderBy: { chantier_id: "desc" },
    });
    const dernierNumero = dernierChantier
      ? parseInt(dernierChantier.chantier_id.replace("CH-", ""), 10)
      : 0;
    return `CH-${String(dernierNumero + 1).padStart(3, "0")}`;
  }),

  récupérerOptions: procédureProtégée.query(async ({ ctx }) => {
    vérifierPermissionAdmin(ctx.session);
    const [ppgs, porteursMIN, porteursDac, perimetres, zonegroups] =
      await Promise.all([
        prisma.metadata_ppgs.findMany({ orderBy: { ppg_id: "asc" } }),
        prisma.metadata_porteurs.findMany({
          where: { porteur_type_short: "MIN" },
          orderBy: { porteur_id: "asc" },
        }),
        prisma.metadata_porteurs.findMany({
          where: { porteur_type_short: "DAC" },
          orderBy: { porteur_id: "asc" },
        }),
        prisma.metadata_perimetres.findMany({
          orderBy: { perimetre_id: "asc" },
        }),
        prisma.metadata_zonegroup.findMany({
          orderBy: { zone_group_id: "asc" },
        }),
      ]);
    return presenterEnOptionsChantierContrat({
      ppgs,
      porteursMIN,
      porteursDac,
      perimetres,
      zonegroups,
    });
  }),

  modifier: procédureProtégée
    .input(validationChantierInput.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await prisma.metadata_chantiers.update({
        where: { chantier_id: input.chantierId },
        data: {
          ch_nom: input.chNom,
          ch_descr: input.chDescr,
          ch_ppg: input.chPpg,
          ch_territo: input.chTerrito,
          ch_hidden_pilote: input.chHiddenPilote,
          ch_saisie_ate: input.chSaisieAte,
          ch_state: input.chState,
          zg_applicable: input.zgApplicable,
          porteur_ids_noDAC: input.porteurIdsNoDAC,
          porteur_ids_DAC: input.porteurIdsDAC,
          ch_per: input.chPer,
          maille_applicable: input.mailleApplicable,
          ch_cible_attendue: input.chCibleAttendue,
          conseiller_mail: input.conseillerMail || null,
        },
      });
    }),

  creer: procédureProtégée
    .input(validationChantierInput.and(zodValidateurCSRF))
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);
      vérifierPermissionAdmin(ctx.session);
      await prisma.metadata_chantiers.create({
        data: {
          chantier_id: input.chantierId,
          ch_nom: input.chNom,
          ch_descr: input.chDescr,
          ch_ppg: input.chPpg,
          ch_territo: input.chTerrito,
          ch_hidden_pilote: input.chHiddenPilote,
          ch_saisie_ate: input.chSaisieAte,
          ch_state: input.chState,
          zg_applicable: input.zgApplicable,
          porteur_ids_noDAC: input.porteurIdsNoDAC,
          porteur_ids_DAC: input.porteurIdsDAC,
          ch_per: input.chPer,
          maille_applicable: input.mailleApplicable,
          ch_cible_attendue: input.chCibleAttendue,
          conseiller_mail: input.conseillerMail || null,
        },
      });
    }),
});
