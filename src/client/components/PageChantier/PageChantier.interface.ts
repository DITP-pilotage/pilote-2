import { TypeIndicateur } from '@/server/chantiers/domain/Indicateur';

export type IndicateurPondération = {
  pondération: string,
  nom: string,
  type: TypeIndicateur,
};
