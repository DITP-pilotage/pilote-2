import { $Enums } from "@prisma/client";
import { DateTime, DurationLike } from "luxon";

// Les calculs de calendrier se font en UTC : le fuseau du serveur ne fixe
// aucune règle métier et les tests ne fixent pas de fuseau.
export const DUREE_VALIDITE_PASSWORD: DurationLike = { months: 6 };
export const DELAI_TRANSITION: DurationLike = { days: 30 };
export const DELAI_PREMIERE_RELANCE: DurationLike = { days: 30 };
export const DELAI_DEUXIEME_RELANCE: DurationLike = { days: 7 };

export interface SuiviPasswordAdmin {
  utilisateurId: string;
  dateDernierChangement: Date;
  dateExpiration: Date;
  datePremiereRelance: Date | null;
  dateDeuxiemeRelance: Date | null;
  dateExpirationForcee: Date | null;
}

/**
 * Expiration à 6 mois du dernier changement, mais jamais à moins de 30 jours
 * d'aujourd'hui : au déploiement, les mots de passe existants sont tous
 * anciens et personne ne doit être forcé sans préavis.
 */
export function calculerDateExpiration(params: {
  dateDernierChangement: Date;
  aujourdHui: Date;
}): Date {
  const expiration = DateTime.fromJSDate(params.dateDernierChangement, {
    zone: "utc",
  }).plus(DUREE_VALIDITE_PASSWORD);
  const borneTransition = DateTime.fromJSDate(params.aujourdHui, {
    zone: "utc",
  }).plus(DELAI_TRANSITION);

  return (
    expiration < borneTransition ? borneTransition : expiration
  ).toJSDate();
}

export function initSuivi(params: {
  utilisateurId: string;
  dateDernierChangement: Date;
  aujourdHui: Date;
}): SuiviPasswordAdmin {
  return {
    utilisateurId: params.utilisateurId,
    dateDernierChangement: params.dateDernierChangement,
    dateExpiration: calculerDateExpiration(params),
    datePremiereRelance: null,
    dateDeuxiemeRelance: null,
    dateExpirationForcee: null,
  };
}

export function saveNewPassword(params: {
  suivi: SuiviPasswordAdmin;
  dateDernierChangement: Date;
  aujourdHui: Date;
}): SuiviPasswordAdmin {
  return {
    ...params.suivi,
    dateDernierChangement: params.dateDernierChangement,
    dateExpiration: calculerDateExpiration(params),
    datePremiereRelance: null,
    dateDeuxiemeRelance: null,
    dateExpirationForcee: null,
  };
}

export function determinerTypeAction(params: {
  suivi: SuiviPasswordAdmin;
  aujourdHui: Date;
}): $Enums.type_action_password | null {
  const { suivi } = params;

  if (suivi.dateExpirationForcee !== null) {
    return null;
  }

  const aujourdHui = DateTime.fromJSDate(params.aujourdHui, { zone: "utc" });
  const expiration = DateTime.fromJSDate(suivi.dateExpiration, {
    zone: "utc",
  });
  const seuilDeuxiemeRelance = expiration.minus(DELAI_DEUXIEME_RELANCE);
  const seuilPremiereRelance = expiration.minus(DELAI_PREMIERE_RELANCE);

  if (aujourdHui >= expiration) {
    return "EXPIRATION";
  }

  if (
    aujourdHui >= seuilDeuxiemeRelance &&
    suivi.dateDeuxiemeRelance === null
  ) {
    return "DEUXIEME_RELANCE";
  }

  if (
    aujourdHui >= seuilPremiereRelance &&
    aujourdHui < seuilDeuxiemeRelance &&
    suivi.datePremiereRelance === null
  ) {
    return "PREMIERE_RELANCE";
  }

  return null;
}
