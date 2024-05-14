import { ReactNode } from 'react';
import { CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type CartographieDonnées = {
  [key in CodeInsee]: {
    valeurAffichée: string, 
    remplissage: string, 
    libellé: string
  }
};

export default interface CartographieProps {
  options?: Partial<CartographieOptions>,
  données: CartographieDonnées,
  children?: ReactNode,
  territoireCode: string,
  mailleSelectionnee: 'départementale' | 'régionale',
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void,
}
