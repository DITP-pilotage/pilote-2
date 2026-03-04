import { Avancement } from "@/server/domain/chantier/avancement/Avancement.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { CodeInsee } from "@/server/domain/territoire/Territoire.interface";

type RepartitionAvancements = {
  global: {
    moyenne: number | null;
    mediane: number | null;
    minimum: number | null;
    maximum: number | null;
  };
  annuel: {
    moyenne: number | null;
  };
};

export type Agregat = {
  repartition: {
    avancements: RepartitionAvancements;
  };
  territoires: {
    [cle in CodeInsee]: {
      repartition: {
        avancements: RepartitionAvancements;
      };
      donneesBrutes: {
        avancements: Avancement[];
      };
    };
  };
};
export type AgregatParTerritoire = {
  [key in Maille]: Agregat;
};
