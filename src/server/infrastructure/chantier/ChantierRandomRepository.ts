import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import ChantierFixture from '@/fixtures/ChantierFixture';

export default class ChantierRandomRepository implements ChantierRepository {
  private readonly valeursFixes: Partial<Chantier>[] | undefined;

  constructor(valeursFixes?: Partial<Chantier>[]) {
    this.valeursFixes = valeursFixes;
  }

  async add(_: Chantier) {
    throw new Error('Error: Not implemented');
  }

  async getById(id: string) {
    return ChantierFixture.générer({ id, ...this.valeursFixes?.[0] });
  }

  async getListe() {
    if (!this.valeursFixes) {
      return [];
    }
    return ChantierFixture.générerPlusieurs(this.valeursFixes.length, this.valeursFixes);
  }
}
