import PérimètreMinistérielFixture from '@/fixtures/PérimètreMinistérielFixture';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import PérimètreMinistérielRepository from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';

export default class PérimètreMinistérielRandomRepository implements PérimètreMinistérielRepository {
  private readonly ids: { id: string }[];

  constructor(ids: { id: string }[]) {
    this.ids = ids;
  }

  async getListe(): Promise<PérimètreMinistériel[]> {
    return PérimètreMinistérielFixture.générerPlusieurs(this.ids.length, this.ids);
  }
}
