import { Maille } from "@/server/domain/maille/Maille.interface";

export type FiltreQueryParams = {
  perimetres: string[];
  axes: string[];
  statut: string[];
  meteos: string[];
  territorialisation: Maille[];
  estBarometre: boolean;
  valeurDeLaRecherche: string;
};

export type SortingParams = {
  desc: boolean;
  id: string;
};
