import Avancement from '@/server/domain/chantier/avancement/Avancement.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

type RépartitionAvancements = {
  global: {
    moyenne: number | null,
    médiane: number | null,
    minimum: number | null,
    maximum: number | null,
  },
  annuel: {
    moyenne: number | null,
  }
};

export type Agrégat = {
  répartition: {
    avancements: RépartitionAvancements
  },
  territoires: {
    [clé in CodeInsee]: {
      répartition: {
        avancements: RépartitionAvancements,
      },
      donnéesBrutes: {
        avancements: Avancement[]
      }
    }
  },
};
export type AgrégatParTerritoire = {
  [key in Maille]: Agrégat
};
