import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import IndicateurFixture from '@/fixtures/IndicateurFixture';
import { FichesIndicateur } from '@/server/domain/indicateur/DetailsIndicateur';

export default class IndicateurRandomRepository implements IndicateurRepository {
  async getByChantierId(_chantierId: string): Promise<Indicateur[]> {
    return IndicateurFixture.générerPlusieurs(5);
  }

  getDetailsIndicateur(_chantierId: string, _maille: string, _codesInsee: string[]): Promise<FichesIndicateur> {
    throw new Error('Not Implemented');
  }
}
