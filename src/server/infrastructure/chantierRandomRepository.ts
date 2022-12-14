import ChantiersFixture from '@/fixtures/ChantiersFixture';
import Chantier from '@/server/domain/chantier/chantier.interface';
import { ChantierRepository } from '@/server/domain/chantier/chantierRepository.interface';

export class ChantierRandomRepository implements ChantierRepository {
  private nombreDeChantiers: number;

  private périmètreIds: { id: string }[];

  constructor(nombreDeChantiers: number, périmètreIds: { id: string }[]) {
    this.nombreDeChantiers = nombreDeChantiers;
    this.périmètreIds = périmètreIds;
  }

  async add(_: Chantier) {
    throw new Error('Error: Not implemented');
  }

  async getListeChantiers() {
    const valeursFixes = [];
    for (let i = 0; i < this.nombreDeChantiers; i = i + 1) {
      valeursFixes.push({ id_périmètre : this.périmètreIds[i % 3].id });
    }
    return ChantiersFixture.générerPlusieurs(this.nombreDeChantiers, valeursFixes);
  }
}
