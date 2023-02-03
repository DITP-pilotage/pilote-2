import Ministère from '@/server/domain/ministère/Ministère.interface';

export default interface MinistèreRepository {
  getListe(): Promise<Ministère[]>;
}
