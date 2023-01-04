import PérimètreMinistérielFixture from '@/fixtures/PérimètreMinistérielFixture';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import PérimètreMinistérielRepository from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';

export default class PérimètreMinistérielRandomRepository implements PérimètreMinistérielRepository {
  private ids: { id: string }[];

  constructor(ids: { id: string }[]) {
    this.ids = ids;
  }

  async add(_: PérimètreMinistériel) {
    throw new Error('Error: Not implemented');
  }

  async getListe(): Promise<PérimètreMinistériel[]> {
    return PérimètreMinistérielFixture.générerPlusieurs(this.ids.length, this.ids);
  }
}
