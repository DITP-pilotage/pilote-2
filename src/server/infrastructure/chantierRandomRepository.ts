import ChantiersFixture from '@/fixtures/ChantiersFixture';
import Chantier from '@/server/domain/chantier/chantier.interface';
import { ChantierRepository } from '@/server/domain/chantier/chantierRepository.interface';

export class ChantierRandomRepository implements ChantierRepository {
  constructor(n: number) {
    this.nombreDeChantiers = n;
  }

  async add(_chantier: Chantier) {
    throw new Error('Error: Not implemented');
  }

  async getListeChantiers() {
    return ChantiersFixture.générerPlusieurs(this.nombreDeChantiers);
  }
}
