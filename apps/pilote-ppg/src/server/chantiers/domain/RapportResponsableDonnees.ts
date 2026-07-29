import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { ContenuRapport } from "@/server/chantiers/domain/RapportPropositionsAvancement";

export interface RapportResponsableDonnees {
  id: string;
  emailResponsable: string;
  contenuRapport: ContenuRapport;
  statutEnvoi: $Enums.statut_envoi_rapport;
  dateCreation: Date;
  dateEnvoi: Date | null;
  dateDerniereTentative: Date | null;
  nombreTentatives: number;
  erreurEnvoi: string | null;
}

export function creerRapportResponsableDonnees(params: {
  emailResponsable: string;
  contenuRapport: ContenuRapport;
  dateCreation: Date;
}): RapportResponsableDonnees {
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

export function marquerRapportResponsableCommeEnvoye(params: {
  rapport: RapportResponsableDonnees;
  dateEnvoi: Date;
}): RapportResponsableDonnees {
  return {
    ...params.rapport,
    statutEnvoi: "ENVOYE",
    dateEnvoi: params.dateEnvoi,
    dateDerniereTentative: params.dateEnvoi,
    nombreTentatives: params.rapport.nombreTentatives + 1,
    erreurEnvoi: null,
  };
}

export function marquerRapportResponsableCommeEchec(params: {
  rapport: RapportResponsableDonnees;
  dateTentative: Date;
  erreur: string;
}): RapportResponsableDonnees {
  return {
    ...params.rapport,
    statutEnvoi: "ECHEC",
    dateDerniereTentative: params.dateTentative,
    nombreTentatives: params.rapport.nombreTentatives + 1,
    erreurEnvoi: params.erreur,
  };
}
