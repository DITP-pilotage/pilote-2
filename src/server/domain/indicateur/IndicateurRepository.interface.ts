import Indicateur, { CartographieIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { FichesIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';

export default interface IndicateurRepository {
  getByChantierId(chantierId: string): Promise<Indicateur[]>;
  getCartographieDonnéesParMailleEtIndicateurId(indicateurId: string, maille: Maille): Promise<CartographieIndicateur>;
  getFichesIndicateurs(chantierId: string, maille: string, codesInsee: string[]): Promise<FichesIndicateurs>;
}
