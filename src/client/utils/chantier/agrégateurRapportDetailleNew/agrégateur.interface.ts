import Avancement from '@/server/domain/chantier/avancement/Avancement.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

type RépartitionAvancementsMaille = {
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

type RépartitionAvancementsTerritoire = {
  global: number | null
  annuel: number | null
};

export type Agrégat = {
  répartition: {
    avancements: RépartitionAvancementsMaille
  },
  territoires: {
    [clé in CodeInsee]: {
      répartition: {
        avancements: RépartitionAvancementsTerritoire,
      },
      donnéesBrutes: {
        avancements: Avancement
      }
    }
  },
};
export type AgrégatParTerritoire = {
  [key in Maille]: Agrégat
};
