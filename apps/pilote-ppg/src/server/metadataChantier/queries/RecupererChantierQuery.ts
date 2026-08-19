import { $Enums, metadata_chantiers } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";
import { Maille } from "@/server/metadataChantier/domain/maille";

export interface MetadataChantier {
  chantierId: string;
  chNom: string;
  chDescr: string | null;
  chPpg: string;
  chTerrito: boolean;
  chHiddenPilote: boolean;
  chSaisieAte: $Enums.type_ate | null;
  chState: $Enums.type_statut;
  zgApplicable: string | null;
  porteurIdsNoDAC: string[];
  porteurIdsDAC: string[];
  chPer: string;
  mailleApplicable: Maille[];
  chCibleAttendue: boolean;
  conseillerMail: string | null;
}

function toApiModel(chantier: metadata_chantiers): MetadataChantier {
  return {
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
    mailleApplicable: chantier.maille_applicable as Maille[],
    chCibleAttendue: chantier.ch_cible_attendue,
    conseillerMail: chantier.conseiller_mail,
  };
}

export class RecupererChantierQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({ chantierId }: { chantierId: string }): Promise<MetadataChantier> {
    const chantier = await this.prisma
      .getInstance()
      .metadata_chantiers.findUniqueOrThrow({
        where: { chantier_id: chantierId },
      });
    return toApiModel(chantier);
  }
}
