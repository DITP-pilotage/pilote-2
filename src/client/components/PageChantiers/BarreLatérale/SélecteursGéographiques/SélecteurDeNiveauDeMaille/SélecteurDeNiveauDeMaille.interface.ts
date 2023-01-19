import { NiveauDeMaille } from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore.interface';

export default interface SélecteurDeNiveauDeMailleProps {
  setNiveauDeMaille: (state: NiveauDeMaille) => void
  niveauDeMaille: Omit<NiveauDeMaille, 'nationale'>
}
