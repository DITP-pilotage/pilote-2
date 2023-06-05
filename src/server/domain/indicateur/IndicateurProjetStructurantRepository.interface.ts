import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateur } from './DétailsIndicateur.interface';

export default interface IndicateurProjetStructurantRepository {
  récupérerParProjetStructurant(projetStructurantId: string): Promise<Indicateur[]>;
}
