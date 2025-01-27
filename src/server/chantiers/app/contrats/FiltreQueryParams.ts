export type FiltreQueryParams = {
  perimetres: string[]
  axes: string[]
  statut: string[]
  meteos: string[]
  estTerritorialise: boolean
  estBarometre: boolean
  valeurDeLaRecherche: string
};

export type SortingParams = {
  desc: boolean;
  id: string;
};
