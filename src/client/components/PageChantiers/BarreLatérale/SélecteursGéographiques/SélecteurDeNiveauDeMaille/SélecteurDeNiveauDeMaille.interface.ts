import { NiveauDeMaille } from '@/client/stores/useNiveauDeMailleStore/useNiveauDeMailleStore.interface';

export default interface SélecteurDeNiveauDeMailleProps {
  setNiveauDeMaille: (state: NiveauDeMaille) => void
  niveauDeMaille: NiveauDeMaille
}
