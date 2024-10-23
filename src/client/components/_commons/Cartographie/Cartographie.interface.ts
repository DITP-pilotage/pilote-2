import { ReactNode } from 'react';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type CartographieDonnées = {
  [key in CodeInsee]: {
    contenu: ReactNode, 
    remplissage: string, 
    libellé: string
  }
};

