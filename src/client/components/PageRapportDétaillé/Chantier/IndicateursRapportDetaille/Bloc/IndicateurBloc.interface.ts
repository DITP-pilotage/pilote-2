import { DétailsIndicateur } from '@/server/chantiers/domain/DétailsIndicateur';

export type IndicateurDétailsParTerritoire = {
  territoireNom: string
  données: DétailsIndicateur
};
