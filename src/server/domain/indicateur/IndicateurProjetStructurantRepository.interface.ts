import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateurs } from './DétailsIndicateur.interface';

export default interface IndicateurProjetStructurantRepository {
  récupérerParProjetStructurant(projetStructurantId: string, projetStructurantCodeInsee: string): Promise<{ indicateurs: Indicateur[], détails: DétailsIndicateurs }>;
}
