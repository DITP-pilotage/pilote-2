import { NiveauDeMaille } from '@/components/_commons/Cartographie/Cartographie.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface RépartitionGéographiqueProps {
  chantiers: Chantier[]
  niveauDeMaille: NiveauDeMaille
}
