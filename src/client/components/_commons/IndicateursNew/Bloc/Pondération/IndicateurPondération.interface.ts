import { Maille } from '@/server/domain/maille/Maille.interface';

export default interface IndicateurPondérationProps {
  indicateurPondération: number | null;
  mailleSélectionnée: Maille;
}
