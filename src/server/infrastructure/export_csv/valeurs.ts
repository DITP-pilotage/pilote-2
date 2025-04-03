import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { libellésMétéos, Météo } from '@/server/domain/météo/Météo.interface';

dayjs.extend(utc);
dayjs.extend(timezone);

export const NON_APPLICABLE = 'Non applicable';
export const NON_RENSEIGNEE = 'Non renseignée';
export const NON_CALCULE_INFO_MANQUANTES = "Non calculé en raison d'informations manquantes";
export const OUI = 'Oui';
export const NON = 'Non';

const formaterMétéoOuErreur = (météo: Météo | null, errorMessage: string) => {
  if (météo === null) {
    return errorMessage;
  }
  return libellésMétéos[météo]?.toUpperCase() || NON_RENSEIGNEE;
};

export const formaterMétéoOuNonApplicable = (meteo: Météo | null) => {
  return formaterMétéoOuErreur(meteo, NON_APPLICABLE);
};

export const formaterMétéoOuNonRenseigne = (meteo: Météo | null, estApplicable: boolean | null) => {
  return formaterMétéoOuErreur(meteo, estApplicable ? NON_RENSEIGNEE : NON_APPLICABLE);
};

const formaterDateHeureOuErreur = (date: string | null, erreurMessage: string) => {
  if (date === null) {
    return erreurMessage;
  }
  return dayjs.tz(date, 'CET').format('DD-MM-YYYY');
};

export const formaterDateHeureOuNonRenseignee = (date: string | null, estApplicable: boolean | null) => {
  return formaterDateHeureOuErreur(date, estApplicable ? NON_RENSEIGNEE : NON_APPLICABLE);
};

const formaterNumeriqueOuErreur = (numerique: Number | null, errorMessage: string) => {
  if (numerique === null || numerique === undefined) {
    return errorMessage;
  }
  return numerique.toLocaleString('fr-FR', { style: 'decimal' }).replace(/\s/g, '');
};

export const formaterNumériqueOuValeurNonApplicable = (numerique: Number | null) => {
  return formaterNumeriqueOuErreur(numerique, NON_APPLICABLE);
};

export const formaterNumériqueOuValeurNonRenseignee = (numerique: Number | null, estApplicable: boolean | null) => {
  return formaterNumeriqueOuErreur(numerique, estApplicable ? NON_RENSEIGNEE : NON_APPLICABLE);
};

export const formaterNumériqueOuValeurManquante = (numerique: Number | null, estApplicable: boolean | null) => {
  return formaterNumeriqueOuErreur(numerique, estApplicable ? NON_CALCULE_INFO_MANQUANTES : NON_APPLICABLE);
};
