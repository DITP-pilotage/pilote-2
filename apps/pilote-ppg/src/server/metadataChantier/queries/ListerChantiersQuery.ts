import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";
import { MetadataChantier } from "@/server/metadataChantier/queries/RecupererChantierQuery";

export class ListerChantiersQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<MetadataChantier[]> {
    const chantiers = await this.prisma
      .getInstance()
      .metadata_chantiers.findMany({ orderBy: { chantier_id: "asc" } });
    return chantiers.map((chantier) => ({
      chantierId: chantier.chantier_id,
      chNom: chantier.ch_nom,
      chDescr: chantier.ch_descr,
      chPpg: chantier.ch_ppg,
      chTerrito: chantier.ch_territo,
      chHiddenPilote: chantier.ch_hidden_pilote,
      chSaisieAte: chantier.ch_saisie_ate,
      chState: chantier.ch_state,
      zgApplicable: chantier.zg_applicable,
      porteurIdsNoDAC: chantier.porteur_ids_noDAC,
      porteurIdsDAC: chantier.porteur_ids_DAC,
      chPer: chantier.ch_per,
      mailleApplicable: chantier.maille_applicable as (
        | "NAT"
        | "REG"
        | "DEPT"
      )[],
      chCibleAttendue: chantier.ch_cible_attendue,
      conseillerMail: chantier.conseiller_mail,
    }));
  }
}
