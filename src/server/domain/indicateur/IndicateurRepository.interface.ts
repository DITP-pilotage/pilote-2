import Indicateur, { CartographieIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { FichesIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { Maille, MailleInterne } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '../territoire/Territoire.interface';

export default interface IndicateurRepository {
  getByChantierId(chantierId: string): Promise<Indicateur[]>;
  getCartographieDonnéesParMailleEtIndicateurId(indicateurId: string, mailleInterne: MailleInterne): Promise<CartographieIndicateur>;
  getFichesIndicateurs(chantierId: string, maille: Maille, codesInsee: CodeInsee[]): Promise<FichesIndicateurs>;
}
