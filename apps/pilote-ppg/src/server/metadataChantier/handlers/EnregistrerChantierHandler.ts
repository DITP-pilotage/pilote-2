import { z } from "zod";
import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";

const MAILLES = ["NAT", "REG", "DEPT"] as const;

export const chantierCommandSchema = z.object({
  chantierId: z.string().regex(/^CH-\d{3}$/),
  chNom: z.string().min(1).max(500),
  chDescr: z.string().nullable(),
  chPpg: z.string(),
  chTerrito: z.boolean(),
  chSaisieAte: z.nativeEnum($Enums.type_ate).nullable(),
  chState: z.nativeEnum($Enums.type_statut),
  zgApplicable: z.string().nullable(),
  porteurIdsNoDAC: z.array(z.string()),
  porteurIdsDAC: z.array(z.string()),
  chPer: z.string(),
  mailleApplicable: z.array(z.enum(MAILLES)).min(1),
  chCibleAttendue: z.boolean(),
  conseillerMail: z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().email().nullable(),
  ),
});

export type ChantierCommand = z.infer<typeof chantierCommandSchema>;

export class EnregistrerChantierHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute(command: ChantierCommand): Promise<void> {
    const data = {
      ch_nom: command.chNom,
      ch_descr: command.chDescr,
      ch_ppg: command.chPpg,
      ch_territo: command.chTerrito,
      ch_saisie_ate: command.chSaisieAte,
      ch_state: command.chState,
      zg_applicable: command.zgApplicable,
      porteur_ids_noDAC: command.porteurIdsNoDAC,
      porteur_ids_DAC: command.porteurIdsDAC,
      ch_per: command.chPer,
      maille_applicable: command.mailleApplicable,
      ch_cible_attendue: command.chCibleAttendue,
      conseiller_mail: command.conseillerMail || null,
    };
    await this.prisma.getInstance().metadata_chantiers.upsert({
      where: { chantier_id: command.chantierId },
      create: { chantier_id: command.chantierId, ...data },
      update: data,
    });
  }
}
