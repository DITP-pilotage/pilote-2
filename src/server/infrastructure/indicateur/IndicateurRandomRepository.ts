import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur, { CartographieIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import IndicateurFixture from '@/fixtures/IndicateurFixture';
import { FichesIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
export default class IndicateurRandomRepository implements IndicateurRepository {
  indicateurs: Indicateur[];

  constructor() {
    this.indicateurs = IndicateurFixture.générerPlusieurs(5);
  }

  async getByChantierId(_chantierId: string): Promise<Indicateur[]> {
    return this.indicateurs;
  }

  getCartographieDonnéesParMailleEtIndicateurId(_indicateurId: string, _maille: Maille): Promise<CartographieIndicateur> {
    throw new Error('Not Implemented');
  }
  
  async getFichesIndicateurs(_chantierId: string, _maille: string, _codesInsee: string[]): Promise<FichesIndicateurs> {
    return IndicateurFixture.générerFichesIndicateurs({ idsIndicateurs: this.indicateurs.map(indicateur => indicateur.id) });
  }
}
