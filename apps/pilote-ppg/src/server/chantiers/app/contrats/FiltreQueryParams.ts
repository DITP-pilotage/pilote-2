import { Maille } from "@/shared/maille/Maille.interface";
import { TriChantiers } from "./TriChantiers";

export type FiltreQueryParams = {
  perimetres: string[];
  axes: string[];
  statut: string[];
  meteos: string[];
  territorialisation: Maille[];
  estBarometre: boolean;
  valeurDeLaRecherche: string;
};

export type SortingParams = TriChantiers;
