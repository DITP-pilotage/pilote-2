import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";

export interface ActionPassword {
  id: string;
  utilisateurId: string;
  typeAction: $Enums.type_action_password;
  dateCreation: Date;
  statut: $Enums.statut_action_password;
  dateSucces: Date | null;
  dateDerniereTentative: Date | null;
  nombreTentatives: number;
  erreur: string | null;
}

export function creerActionPassword(params: {
  utilisateurId: string;
  dateCreation: Date;
  typeAction: $Enums.type_action_password;
}): ActionPassword {
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
  action: ActionPassword;
  dateSucces: Date;
}): ActionPassword {
  return {
    ...params.action,
    dateSucces: params.dateSucces,
    statut: "SUCCES",
  };
}

export function marquerCommeEchec(params: {
  action: ActionPassword;
  dateTentative: Date;
  erreur: string;
}): ActionPassword {
  return {
    ...params.action,
    statut: "ECHEC",
    nombreTentatives: params.action.nombreTentatives + 1,
    dateDerniereTentative: params.dateTentative,
    erreur: params.erreur,
  };
}
