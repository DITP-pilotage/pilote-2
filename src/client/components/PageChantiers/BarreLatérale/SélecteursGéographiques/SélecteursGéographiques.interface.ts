import { NiveauDeMaille } from '@/components/_commons/Cartographie/Cartographie.interface';

export default interface SélecteursGéographiquesProps {
  setNiveauDeMaille: (state: NiveauDeMaille) => void
  niveauDeMaille: NiveauDeMaille
}
