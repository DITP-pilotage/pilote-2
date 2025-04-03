import { Axe } from '@/server/chantiers/domain/Axe';

export interface AxeRepository {
  getListe(): Promise<Axe[]>;
  getListePourChantiers(chantierIds: string[]): Promise<Axe[]>;
}
