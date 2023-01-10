import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import IndicateurFixture from '@/fixtures/IndicateurFixture';

export default class IndicateurRandomRepository implements IndicateurRepository {

  async getByChantierId(_chantierId: string): Promise<Indicateur[]> {
    return IndicateurFixture.générerPlusieurs(5);
  }
}
