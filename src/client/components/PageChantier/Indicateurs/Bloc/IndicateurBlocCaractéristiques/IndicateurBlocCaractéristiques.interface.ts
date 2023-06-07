import { Maille } from '@/server/domain/maille/Maille.interface';
import Indicateur from '@/server/domain/chantier/indicateur/Indicateur.interface';

export default interface IndicateurBlocCaractéristiquesProps {
  indicateurPondération: Indicateur['pondération'];
  mailleSélectionnée: Maille;
}
