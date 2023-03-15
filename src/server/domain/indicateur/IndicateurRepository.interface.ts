import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '../territoire/Territoire.interface';

export default interface IndicateurRepository {
  récupérerParChantierId(chantierId: string): Promise<Indicateur[]>;
  récupérerDétails(indicateurId: string, maille: Maille): Promise<DétailsIndicateurs>;
  récupererDétailsParChantierIdEtTerritoire(chantierId: string, maille: Maille, codesInsee: CodeInsee[]): Promise<DétailsIndicateurs>;
}
