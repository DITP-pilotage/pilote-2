import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { Coordinateur } from "./Coordinateur";
import { PeriodeRapport } from "./PeriodeRapport";
import { SectionActiviteComptes } from "./SectionActiviteComptes";
import { CompteActivite } from "./CompteActivite";
import { SectionChantierVA } from "./SectionActiviteChantiersVA";

export type RapportHebdomadaire = {
  id: string;
  coordinateur: Coordinateur;
  periode: PeriodeRapport;
  sectionActiviteComptes: SectionActiviteComptes;
  chantiers: SectionChantierVA[];
  statutEnvoi: $Enums.statut_envoi_rapport;
  dateCreation: Date;
  dateEnvoi?: Date;
  dateDerniereTentative?: Date;
  nombreTentatives: number;
  erreurEnvoi?: string;
};

export function creerRapportHebdomadaire(params: {
  coordinateur: Coordinateur;
  periode: PeriodeRapport;
  comptesCrees: CompteActivite[];
  comptesDesactives: CompteActivite[];
  chantiers: SectionChantierVA[];
  dateCreation: Date;
}): RapportHebdomadaire | null {
  const hasAccountActivity =
    params.comptesCrees.length > 0 || params.comptesDesactives.length > 0;
  const hasVAActivity = params.chantiers.length > 0;

  if (!hasAccountActivity && !hasVAActivity) {
    return null;
  }

  return {
    id: randomUUID(),
    coordinateur: params.coordinateur,
    periode: params.periode,
    sectionActiviteComptes: {
      comptesCrees: params.comptesCrees,
      comptesDesactives: params.comptesDesactives,
    },
    chantiers: params.chantiers,
    statutEnvoi: $Enums.statut_envoi_rapport.CREE,
    dateCreation: params.dateCreation,
    nombreTentatives: 0,
  };
}

export function marquerCommeEnvoye(params: {
  rapport: RapportHebdomadaire;
  dateEnvoi: Date;
}): RapportHebdomadaire {
  return {
    ...params.rapport,
    statutEnvoi: $Enums.statut_envoi_rapport.ENVOYE,
    dateEnvoi: params.dateEnvoi,
    dateDerniereTentative: params.dateEnvoi,
    nombreTentatives: params.rapport.nombreTentatives + 1,
  };
}

export function marquerCommeEchec(params: {
  rapport: RapportHebdomadaire;
  erreur: string;
  dateTentative: Date;
}): RapportHebdomadaire {
  return {
    ...params.rapport,
    statutEnvoi: $Enums.statut_envoi_rapport.ECHEC,
    erreurEnvoi: params.erreur,
    dateDerniereTentative: params.dateTentative,
    nombreTentatives: params.rapport.nombreTentatives + 1,
  };
}
