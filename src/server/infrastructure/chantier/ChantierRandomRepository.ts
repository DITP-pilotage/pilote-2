import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import ChantierFixture from '@/fixtures/ChantierFixture';

export default class ChantierRandomRepository implements ChantierRepository {

  async add(_: Chantier) {
    throw new Error('Error: Not implemented');
  }

  async getById(id: string, zoneNom: string) {
    return ChantierFixture.générer({ id, zoneNom });
  }
}
