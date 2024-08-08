import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type CartographieDonnées = {
  [key in CodeInsee]: {
    valeurAffichée: string, 
    remplissage: string, 
    libellé: string
  }
};

