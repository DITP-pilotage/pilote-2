import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";

export interface ContenuRapport {
  chantiersAvecPropositions: {
    chantierId: string;
    chantierNom: string;
    nombrePropositions: number;
  }[];
  chantiersAvecIndicateursNonAJour: {
    chantierId: string;
    chantierNom: string;
    indicateurs: { id: string; nom: string }[];
  }[];
}

export interface RapportPropositionsAvancement {
  id: string;
  utilisateurId: string;
  contenuRapport: ContenuRapport;
  statutEnvoi: $Enums.statut_envoi_rapport;
  dateCreation: Date;
  dateEnvoi: Date | null;
  dateDerniereTentative: Date | null;
  nombreTentatives: number;
  erreurEnvoi: string | null;
}

export function creerRapportPropositionsAvancement(params: {
  utilisateurId: string;
  contenuRapport: ContenuRapport;
  dateCreation: Date;
}): RapportPropositionsAvancement {
  return {
    id: randomUUID(),
    ...params,
    statutEnvoi: "CREE",
    dateEnvoi: null,
    dateDerniereTentative: null,
    nombreTentatives: 0,
    erreurEnvoi: null,
  };
}

export function marquerRapportCommeEnvoye(params: {
  rapport: RapportPropositionsAvancement;
  dateEnvoi: Date;
}): RapportPropositionsAvancement {
  return {
    ...params.rapport,
    statutEnvoi: "ENVOYE",
    dateEnvoi: params.dateEnvoi,
    dateDerniereTentative: params.dateEnvoi,
    nombreTentatives: params.rapport.nombreTentatives + 1,
    erreurEnvoi: null,
  };
}

export function marquerRapportCommeEchec(params: {
  rapport: RapportPropositionsAvancement;
  dateTentative: Date;
  erreur: string;
}): RapportPropositionsAvancement {
  return {
    ...params.rapport,
    statutEnvoi: "ECHEC",
    dateDerniereTentative: params.dateTentative,
    nombreTentatives: params.rapport.nombreTentatives + 1,
    erreurEnvoi: params.erreur,
  };
}
