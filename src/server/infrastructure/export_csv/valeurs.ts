import { libellésMétéos, Météo } from '@/server/domain/météo/Météo.interface';

export const NON_APPLICABLE = 'N/A';
export const OUI = 'Oui';
export const NON = 'Non';

export function formaterMétéo(météo: Météo) {
  return libellésMétéos[météo]?.toUpperCase() || NON_APPLICABLE;
}
