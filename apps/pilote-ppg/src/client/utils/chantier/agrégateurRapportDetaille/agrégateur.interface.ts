import { Maille } from "@/server/domain/maille/Maille.interface";
import { CodeInsee } from "@/server/domain/territoire/Territoire.interface";

type RépartitionAvancementsMaille = {
  global: {
    moyenne: number | null;
    médiane: number | null;
    minimum: number | null;
    maximum: number | null;
  };
  annuel: {
    moyenne: number | null;
  };
};

type RépartitionAvancementsTerritoire = {
  global: { avancement: number | null; date: string | null };
  annuel: { avancement: number | null; date: string | null };
};

export type Agrégat = {
  répartition: {
    avancements: RépartitionAvancementsMaille;
  };
  territoires: {
    [clé in CodeInsee]: {
      répartition: {
        avancements: RépartitionAvancementsTerritoire;
      };
      donnéesBrutes: {
        avancements: RépartitionAvancementsTerritoire;
      };
    };
  };
};
export type AgrégatParTerritoire = {
  [key in Maille]: Agrégat;
};
