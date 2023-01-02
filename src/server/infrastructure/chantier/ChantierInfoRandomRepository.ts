import ChantierInfosFixture from '@/fixtures/ChantierInfosFixture';
import ChantierInfoRepository from '@/server/domain/chantier/ChantierInfoRepository.interface';

export default class ChantierInfoRandomRepository implements ChantierInfoRepository {
  private readonly nombreDeChantiers: number;

  private idPérimètres: { id: string }[];

  constructor(nombreDeChantiers: number, idPérimètres: { id: string }[]) {
    this.nombreDeChantiers = nombreDeChantiers;
    this.idPérimètres = idPérimètres;
  }

  async getListeMailleNationale() {
    const valeursFixes = [];
    const nbPérimètres = this.idPérimètres.length;
    for (let i = 0; i < this.nombreDeChantiers; i = i + 1) {
      valeursFixes.push({ périmètreIds : [this.idPérimètres[i % (nbPérimètres - 1)].id] });
    }
    return ChantierInfosFixture.générerPlusieurs(this.nombreDeChantiers, valeursFixes);
  }
}
