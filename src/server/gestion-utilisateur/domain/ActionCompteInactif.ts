import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";

export interface ActionCompteInactif {
  id: string;
  utilisateurId: string;
  typeAction: $Enums.type_action_compte_inactif;
  dateCreation: Date;
  statut: $Enums.statut_action_compte_inactif;
  dateSucces: Date | null;
  dateDerniereTentative: Date | null;
  nombreTentatives: number;
  erreur: string | null;
}

export function creerActionCompteInactif(params: {
  utilisateurId: string;
  dateCreation: Date;
  typeAction: $Enums.type_action_compte_inactif;
}): ActionCompteInactif {
  return {
    id: randomUUID(),
    ...params,
    statut: "CREEE",
    dateSucces: null,
    dateDerniereTentative: null,
    nombreTentatives: 0,
    erreur: null,
  };
}

export function marquerCommeSucces(params: {
  action: ActionCompteInactif;
  dateSucces: Date;
}): ActionCompteInactif {
  return {
    ...params.action,
    dateSucces: params.dateSucces,
    statut: "SUCCES",
  };
}

export function marquerCommeEchec(params: {
  action: ActionCompteInactif;
  dateTentative: Date;
  erreur: string;
}): ActionCompteInactif {
  return {
    ...params.action,
    statut: "ERREUR",
    nombreTentatives: params.action.nombreTentatives + 1,
    dateDerniereTentative: params.dateTentative,
    erreur: params.erreur,
  };
}
