import Ppg from '@/server/domain/ppg/Ppg.interface';

export default interface PpgRepository {
  getListe(): Promise<Ppg[]>;
}
