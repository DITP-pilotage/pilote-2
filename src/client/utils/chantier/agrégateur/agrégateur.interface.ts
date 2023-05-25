import Avancement from '@/server/domain/chantier/avancement/Avancement.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
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

type RépartitionMétéos = Record<Météo, number>;

export type AgrégatParTerritoire = {
  [key in Maille]: {
    répartition: {
      avancements: RépartitionAvancements
    },
    territoires: {
      [clé in CodeInsee]: {
        répartition: {
          avancements: RépartitionAvancements,
          météos: RépartitionMétéos
        },
        donnéesBrutes: {
          avancements: Avancement[]
          météos: Météo[]
        }
      }
    },
  }
};
