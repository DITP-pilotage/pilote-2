import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { Coordinateur } from "./Coordinateur";
import { PeriodeRapport } from "./PeriodeRapport";
import { SectionActiviteComptes } from "./SectionActiviteComptes";
import { CompteActivite } from "./CompteActivite";
import { SectionActiviteChantiersVA } from "./SectionActiviteChantiersVA";

export type RapportHebdomadaire = {
  id: string;
  coordinateur: Coordinateur;
  periode: PeriodeRapport;
  sectionActiviteComptes: SectionActiviteComptes;
  sectionActiviteChantiersVA: SectionActiviteChantiersVA;
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
  sectionActiviteChantiersVA: SectionActiviteChantiersVA;
  dateCreation: Date;
}): RapportHebdomadaire {
  return {
    id: randomUUID(),
    coordinateur: params.coordinateur,
    periode: params.periode,
    sectionActiviteComptes: {
      comptesCrees: params.comptesCrees,
      comptesDesactives: params.comptesDesactives,
    },
    sectionActiviteChantiersVA: params.sectionActiviteChantiersVA,
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
