import Ministère from '@/server/domain/ministère/Ministère.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface MinistèreRepository {
  getListe(): Promise<Ministère[]>;
  getListePourChantiers(chantiers: Chantier[]): Promise<Ministère[]>;
}


