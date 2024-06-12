import { DonneeIndicateur } from '@/server/chantiers/domain/DonneeIndicateur';

export interface IndicateurRepository {
  listerParIndicId({ indicId }: { indicId: string }): Promise<DonneeIndicateur[]>;
}
