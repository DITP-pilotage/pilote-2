import { Maille } from '@/server/domain/maille/Maille.interface';
import { IndicateurPondération } from '@/server/domain/indicateur/Indicateur.interface';

export default interface IndicateurPondérationProps {
  indicateurPondération: IndicateurPondération;
  mailleSélectionnée: Maille;
}
