import { Coordinateur } from "./Coordinateur";
import { PeriodeRapport } from "./PeriodeRapport";
import { SectionActiviteComptes } from "./SectionActiviteComptes";
import { StatutEnvoi } from "./StatutEnvoi";
import { CompteActivite } from "./CompteActivite";

export type RapportHebdomadaire = {
  readonly id?: string;
  readonly coordinateur: Coordinateur;
  readonly periode: PeriodeRapport;
  readonly sectionActiviteComptes: SectionActiviteComptes;
  readonly statutEnvoi: StatutEnvoi;
  readonly dateCreation: Date;
  readonly dateEnvoi?: Date;
  readonly dateDerniereTentative?: Date;
  readonly nombreTentatives: number;
  readonly erreurEnvoi?: string;
};

export function creerRapportHebdomadaire(params: {
  coordinateur: Coordinateur;
  periode: PeriodeRapport;
  comptesCreés: readonly CompteActivite[];
  comptesDésactivés: readonly CompteActivite[];
  dateCreation: Date;
}): RapportHebdomadaire {
  return {
    coordinateur: params.coordinateur,
    periode: params.periode,
    sectionActiviteComptes: {
      comptesCreés: params.comptesCreés,
      comptesDésactivés: params.comptesDésactivés,
    },
    statutEnvoi: StatutEnvoi.CREE,
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
    statutEnvoi: StatutEnvoi.ENVOYE,
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
    statutEnvoi: StatutEnvoi.ECHEC,
    erreurEnvoi: params.erreur,
    dateDerniereTentative: params.dateTentative,
    nombreTentatives: params.rapport.nombreTentatives + 1,
  };
}

export function aActivite(rapport: RapportHebdomadaire): boolean {
  return (
    rapport.sectionActiviteComptes.comptesCreés.length > 0 ||
    rapport.sectionActiviteComptes.comptesDésactivés.length > 0
  );
}
