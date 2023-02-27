import Axe from '@/server/domain/axe/Axe.interface';

export default interface AxeRepository {
  getListe(): Promise<Axe[]>;
}
