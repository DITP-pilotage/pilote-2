import { DétailsIndicateur } from '@/server/domain/indicateur/DétailsIndicateur.interface';

export type IndicateurDétailsParTerritoire = {
  territoireNom: string
  données: DétailsIndicateur
};
