import {
  $Enums,
  metadata_chantiers,
  metadata_perimetres,
  metadata_porteurs,
  metadata_ppgs,
  metadata_zonegroup,
} from "@prisma/client";

export interface MetadataChantierContrat {
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
  mailleApplicable: ("NAT" | "REG" | "DEPT")[];
  chCibleAttendue: boolean;
  conseillerMail: string | null;
}

export interface OptionsChantierContrat {
  ppgs: { id: string; nom: string }[];
  porteursMIN: { id: string; label: string }[];
  porteursDac: { id: string; label: string }[];
  perimetres: { id: string; nom: string }[];
  zonegroups: { id: string; nom: string }[];
}

export const presenterEnMetadataChantierContrat = (
  chantier: metadata_chantiers,
): MetadataChantierContrat => ({
  chantierId: chantier.chantier_id,
  chNom: chantier.ch_nom,
  chDescr: chantier.ch_descr,
  chPpg: chantier.ch_ppg,
  chTerrito: chantier.ch_territo,
  chHiddenPilote: chantier.ch_hidden_pilote,
  chSaisieAte: chantier.ch_saisie_ate,
  chState: chantier.ch_state,
  zgApplicable: chantier.zg_applicable,
  porteurIdsNoDAC: chantier.porteur_ids_noDAC ?? [],
  porteurIdsDAC: chantier.porteur_ids_DAC ?? [],
  chPer: chantier.ch_per,
  mailleApplicable: chantier.maille_applicable as ("NAT" | "REG" | "DEPT")[],
  chCibleAttendue: chantier.ch_cible_attendue,
  conseillerMail: chantier.conseiller_mail,
});

export const presenterEnOptionsChantierContrat = ({
  ppgs,
  porteursMIN,
  porteursDac,
  perimetres,
  zonegroups,
}: {
  ppgs: metadata_ppgs[];
  porteursMIN: metadata_porteurs[];
  porteursDac: metadata_porteurs[];
  perimetres: metadata_perimetres[];
  zonegroups: metadata_zonegroup[];
}): OptionsChantierContrat => ({
  ppgs: ppgs.map((p) => ({ id: p.ppg_id, nom: p.ppg_nom })),
  porteursMIN: porteursMIN.map((p) => ({
    id: p.porteur_id,
    label: p.porteur_name_short ?? p.porteur_short,
  })),
  porteursDac: porteursDac.map((p) => ({
    id: p.porteur_id,
    label: p.porteur_name_short ?? p.porteur_short,
  })),
  perimetres: perimetres.map((p) => ({ id: p.perimetre_id, nom: p.per_nom })),
  zonegroups: zonegroups.map((z) => ({
    id: z.zone_group_id,
    nom: z.zg_name ?? z.zone_group_id,
  })),
});
