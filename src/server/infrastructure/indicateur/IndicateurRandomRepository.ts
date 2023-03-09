import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur, { CartographieIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import IndicateurFixture from '@/fixtures/IndicateurFixture';
import { FichesIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';

export default class IndicateurRandomRepository implements IndicateurRepository {
  indicateurs: Indicateur[];

  constructor() {
    this.indicateurs = IndicateurFixture.générerPlusieurs(5, [{ id: 'IND-001' }, { id: 'IND-002' }, { id: 'IND-003' }, { id: 'IND-004' }, { id: 'IND-005' }]);
  }

  async getByChantierId(_chantierId: string): Promise<Indicateur[]> {
    return this.indicateurs;
  }

  async getCartographieDonnéesParMailleEtIndicateurId(_indicateurId: string, _maille: MailleInterne): Promise<CartographieIndicateur> {
    return IndicateurFixture.générerCartographieIndicateurDonnées(_maille);
  }
  
  async getFichesIndicateurs(_chantierId: string, _maille: string, _codesInsee: string[]): Promise<FichesIndicateurs> {
    return IndicateurFixture.générerFichesIndicateurs(this.indicateurs.map(indicateur => indicateur.id), _codesInsee);
  }
}
