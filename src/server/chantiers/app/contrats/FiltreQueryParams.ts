import { ColumnSort } from '@tanstack/react-table';

export type FiltreQueryParams = {
  perimetres: string[]
  axes: string[]
  statut: string[]
  estTerritorialise: boolean
  estBarometre: boolean
  sorting: ColumnSort[]
  valeurDeLaRecherche: string
};
