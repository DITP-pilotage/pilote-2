import { Territoire } from '@/server/fiche-territoriale/domain/Territoire';

export interface TerritoireContrat {
  nomAffiché: string;
}

export const presenterEnTerritoireContrat = (territoire: Territoire): TerritoireContrat => {
  return {
    nomAffiché: territoire.nomAffiché,
  };
};
