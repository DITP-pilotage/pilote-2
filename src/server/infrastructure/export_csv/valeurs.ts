import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { libellésMétéos, Météo } from '@/server/domain/météo/Météo.interface';

export const NON_APPLICABLE = 'N/A';
export const OUI = 'Oui';
export const NON = 'Non';

export function formaterMétéo(météo: Météo | null) {
  if (météo === null) {
    return NON_APPLICABLE;
  }
  return libellésMétéos[météo]?.toUpperCase() || NON_APPLICABLE;
}

export function formaterDateHeure(date: string | null) {
  if (date === null) {
    return NON_APPLICABLE;
  }
  return dayjs.tz(date, 'CET').format('YYYY-MM-DD HH:mm:ss');
}

export function horodatage() {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  return dayjs.tz(new Date(), 'CET').format('YYYY-MM-DD-HH-mm-ss');
}
