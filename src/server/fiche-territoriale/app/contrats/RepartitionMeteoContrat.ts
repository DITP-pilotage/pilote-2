import { RepartitionMeteo } from '@/server/fiche-territoriale/domain/RepartitionMeteo';

export type RepartitionMeteoContrat = {
  COUVERT: number,
  NUAGE: number,
  ORAGE: number,
  SOLEIL: number,
};
export const presenterEnRépartitionsMétéosContrat = (répartitionsMétéos: RepartitionMeteo): RepartitionMeteoContrat => {
  return {
    COUVERT: répartitionsMétéos.nombreCouvert,
    NUAGE: répartitionsMétéos.nombreNuage,
    ORAGE: répartitionsMétéos.nombreOrage,
    SOLEIL: répartitionsMétéos.nombreSoleil,
  };
};
