import ChantiersFixture from '@/fixtures/ChantiersFixture';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';

export default class ChantierRandomRepository implements ChantierRepository {
  private nombreDeChantiers: number;

  private idPérimètres: { id: string }[];

  constructor(nombreDeChantiers: number, idPérimètres: { id: string }[]) {
    this.nombreDeChantiers = nombreDeChantiers;
    this.idPérimètres = idPérimètres;
  }

  async add(_: Chantier) {
    throw new Error('Error: Not implemented');
  }

  async getListe() {
    const valeursFixes = [];
    const nbPérimètres = this.idPérimètres.length;
    for (let i = 0; i < this.nombreDeChantiers; i = i + 1) {
      valeursFixes.push({ id_périmètre : this.idPérimètres[i % (nbPérimètres - 1)].id });
    }
    return ChantiersFixture.générerPlusieurs(this.nombreDeChantiers, valeursFixes);
  }
}
