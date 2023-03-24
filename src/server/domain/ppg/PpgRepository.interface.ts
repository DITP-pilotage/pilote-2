import Ppg from '@/server/domain/ppg/Ppg.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface PpgRepository {
  getListe(): Promise<Ppg[]>;
  getListePourChantiers(chantiers: Chantier[]): Promise<Ppg[]>;
}
