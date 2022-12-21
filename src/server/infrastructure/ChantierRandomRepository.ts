import ChantierInfosFixture from '@/fixtures/ChantierInfosFixture';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';

export default class ChantierRandomRepository implements ChantierRepository {
  private readonly _chantiers: { [index: string]: Chantier };

  constructor() {
    this._chantiers = {};
  }

  async add(_: Chantier) {
    throw new Error('Error: Not implemented');
  }

  async getById(id: string) {
    let result = this._chantiers[id];
    if (!result) {
      result = ChantierInfosFixture.générer({ id });
      this._chantiers[id] = result;
    }
    return result;
  }
}
