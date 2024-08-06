import { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';

export type IndicateurPondération = {
  pondération: string,
  nom: string,
  type: TypeIndicateur,
};
