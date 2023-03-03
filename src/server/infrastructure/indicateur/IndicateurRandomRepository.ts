import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur, { CartographieIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import IndicateurFixture from '@/fixtures/IndicateurFixture';
import { FichesIndicateurs } from '@/server/domain/indicateur/DetailsIndicateur.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';

export default class IndicateurRandomRepository implements IndicateurRepository {
  async getByChantierId(_chantierId: string): Promise<Indicateur[]> {
    return IndicateurFixture.générerPlusieurs(5);
  }

  getCartographieDataByMailleAndIndicateurId(_indicateurId: string, _maille: Maille): Promise<CartographieIndicateur> {
    throw new Error('Not Implemented');
  }
  
  getDetailsIndicateur(_chantierId: string, _maille: string, _codesInsee: string[]): Promise<FichesIndicateurs> {
    throw new Error('Not Implemented');
  }
}
