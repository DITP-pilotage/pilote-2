import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import ChantierFixture from '@/fixtures/ChantierFixture';

export default class ChantierRandomRepository implements ChantierRepository {
  private valeurFixes: Partial<Chantier> | undefined;

  constructor(valeurFixes?: Partial<Chantier>) {
    this.valeurFixes = valeurFixes;
  }

  async add(_: Chantier) {
    throw new Error('Error: Not implemented');
  }

  async getById(id: string) {
    return ChantierFixture.générer({ id, ...this.valeurFixes });
  }
}
