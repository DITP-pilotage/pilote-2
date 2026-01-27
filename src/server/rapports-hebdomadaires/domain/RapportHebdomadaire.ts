import { Coordinateur } from "./Coordinateur";
import { PeriodeRapport } from "./PeriodeRapport";
import { SectionActiviteComptes } from "./SectionActiviteComptes";
import { CompteActivite } from "./CompteActivite";
import { $Enums } from "@prisma/client";

export type RapportHebdomadaire = {
  readonly id?: string;
  readonly coordinateur: Coordinateur;
  readonly periode: PeriodeRapport;
  readonly sectionActiviteComptes: SectionActiviteComptes;
  readonly statutEnvoi: $Enums.statut_envoi_rapport;
  readonly dateCreation: Date;
  readonly dateEnvoi?: Date;
  readonly dateDerniereTentative?: Date;
  readonly nombreTentatives: number;
  readonly erreurEnvoi?: string;
};

export function creerRapportHebdomadaire(params: {
  coordinateur: Coordinateur;
  periode: PeriodeRapport;
  comptesCrees: readonly CompteActivite[];
  comptesDesactives: readonly CompteActivite[];
  dateCreation: Date;
}): RapportHebdomadaire {
  return {
    coordinateur: params.coordinateur,
    periode: params.periode,
    sectionActiviteComptes: {
      comptesCrees: params.comptesCrees,
      comptesDesactives: params.comptesDesactives,
    },
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
