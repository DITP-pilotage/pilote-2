export type FiltreQueryParams = {
  perimetres: string[]
  axes: string[]
  statut: string[]
  estTerritorialise: boolean
  estBarometre: boolean
  sorting: {   
    desc: boolean;
    id: string;
  }
  valeurDeLaRecherche: string
};
