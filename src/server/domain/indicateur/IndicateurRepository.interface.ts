import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { EvolutionIndicateur } from '@/server/domain/indicateur/EvolutionIndicateur';
import { FichesIndicateur } from '@/server/domain/indicateur/DetailsIndicateur';

export default interface IndicateurRepository {
  getByChantierId(chantierId: string): Promise<Indicateur[]>;
  getEvolutionIndicateur(chantierId: string, indicateurId: string, maille: string, codes_insee: string[]): Promise<EvolutionIndicateur[]>;
}
