import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import IndicateurFixture from '@/fixtures/IndicateurFixture';
import { EvolutionIndicateur } from '@/server/domain/indicateur/EvolutionIndicateur';

export default class IndicateurRandomRepository implements IndicateurRepository {
  getEvolutionIndicateur(_chantierId: string, _indicateurId: string, _maille: string, _codes_insee: string[]): Promise<EvolutionIndicateur[]> {
    throw new Error('Not Implemented');
  }

  async getByChantierId(_chantierId: string): Promise<Indicateur[]> {
    return IndicateurFixture.générerPlusieurs(5);
  }
}
