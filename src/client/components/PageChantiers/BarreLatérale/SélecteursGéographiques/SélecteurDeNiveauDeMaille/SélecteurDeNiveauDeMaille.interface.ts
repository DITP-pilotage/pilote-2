import { NiveauDeMaille } from '@/components/_commons/Cartographie/Cartographie.interface';

export default interface SélecteurDeNiveauDeMailleProps {
  setNiveauDeMaille: (state: NiveauDeMaille) => void
  niveauDeMaille: NiveauDeMaille
}
