export type FiltreQueryParams = {
  perimetres: string[]
  axes: string[]
  statut: string[]
  estTerritorialise: boolean
  estBarometre: boolean
  valeurDeLaRecherche: string
  mailleChantier: 'nationale' | 'régionale' | 'départementale'
};

export type SortingParams = {
  desc: boolean;
  id: string;
};
