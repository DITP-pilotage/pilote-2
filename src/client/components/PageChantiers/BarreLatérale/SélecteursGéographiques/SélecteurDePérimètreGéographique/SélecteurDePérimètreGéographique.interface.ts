import { NiveauDeMaille } from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore.interface';

export type PérimètreGéographiqueIdentifiant = {
  codeInsee: string,
  maille: 'nationale' | 'départementale' | 'régionale',
};

export default interface SélecteurDePérimètreGéographiqueProps {
  niveauDeMaille: NiveauDeMaille,
}
