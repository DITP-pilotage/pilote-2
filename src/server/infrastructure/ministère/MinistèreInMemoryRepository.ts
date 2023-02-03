import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';

export default class MinistèreInMemoryRepository implements MinistèreRepository {
  getListe(): Promise<Ministère[]> {
    return Promise.resolve([
      {
        nom: 'Ministère 1',
        périmètresMinistériels: [{ id: 'PER-001', nom: 'Périmètre 1.1' }, { id: 'PER-002', nom: 'Périmètre 1.2' }],
      },
      {
        nom: 'Ministère 2',
        périmètresMinistériels: [{ id: 'PER-003', nom: 'Périmètre 2.3' }],
      },
      {
        nom: 'Ministère 3',
        périmètresMinistériels: [{ id: 'PER-004', nom: 'Périmètre 3.4' }],
      },
    ]);
  }
}
