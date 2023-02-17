import { Avancement, Maille } from '@/server/domain/chantier/Chantier.interface';
import Météo from '@/server/domain/chantier/Météo.interface';

type RépartitionAvancements = {
  moyenne: number | null,
  médiane: number | null,
  minimum: number | null,
  maximum: number | null,
};

type RépartitionMétéos = Record<Météo, number>;

export type AgrégatParTerritoire = {
  [key in Maille]: {
    répartition: {
      avancements: RépartitionAvancements
    },
    territoires: {
      [key: string]: {
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
