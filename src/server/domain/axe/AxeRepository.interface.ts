import Axe from '@/server/domain/axe/Axe.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface AxeRepository {
  getListe(): Promise<Axe[]>;
  getListePourChantiers(chantiers: Chantier[]): Promise<Axe[]>;
}
