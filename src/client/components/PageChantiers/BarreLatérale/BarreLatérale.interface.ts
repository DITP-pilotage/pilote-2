import { NiveauDeMaille } from '@/components/_commons/Cartographie/Cartographie.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

export default interface BarreLatéraleProps {
  estOuvert: boolean,
  setEstOuvert: (state: boolean) => void,
  périmètresMinistériels: PérimètreMinistériel[],
  setNiveauDeMaille: (state: NiveauDeMaille) => void
}
