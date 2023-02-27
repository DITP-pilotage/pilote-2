import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { FichesIndicateur } from '@/server/domain/indicateur/DetailsIndicateur';

export default interface IndicateurRepository {
  getByChantierId(chantierId: string): Promise<Indicateur[]>;
  getDetailsIndicateur(chantierId: string, maille: string, codesInsee: string[]): Promise<FichesIndicateur>;
}
