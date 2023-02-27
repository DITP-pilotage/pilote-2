import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { FichesIndicateurs } from '@/server/domain/indicateur/DetailsIndicateur.interface';

export default interface IndicateurRepository {
  getByChantierId(chantierId: string): Promise<Indicateur[]>;
  getDetailsIndicateur(chantierId: string, maille: string, codesInsee: string[]): Promise<FichesIndicateurs>;
}
