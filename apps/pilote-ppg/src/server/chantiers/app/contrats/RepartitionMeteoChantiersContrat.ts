import { RepartitionMeteoChantiers } from "@/server/chantiers/domain/RepartitionMeteoChantiers";

export type RepartitionMeteoChantiersContrat = {
  COUVERT: number;
  NUAGE: number;
  ORAGE: number;
  SOLEIL: number;
};
export const presenterEnRépartitionsMétéosChantiersContrat = (
  répartitionsMétéos: RepartitionMeteoChantiers,
): RepartitionMeteoChantiersContrat => {
  return {
    COUVERT: répartitionsMétéos.nombreCouvert,
    NUAGE: répartitionsMétéos.nombreNuage,
    ORAGE: répartitionsMétéos.nombreOrage,
    SOLEIL: répartitionsMétéos.nombreSoleil,
  };
};
