import Indicateur, { CartographieIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { FichesIndicateurs } from '@/server/domain/indicateur/DetailsIndicateur.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';

export default interface IndicateurRepository {
  getByChantierId(chantierId: string): Promise<Indicateur[]>;
  getCartographieDonnéesByMailleAndIndicateurId(indicateurId: string, maille: Maille): Promise<CartographieIndicateur>;
  getDetailsIndicateur(chantierId: string, maille: string, codesInsee: string[]): Promise<FichesIndicateurs>;
}
