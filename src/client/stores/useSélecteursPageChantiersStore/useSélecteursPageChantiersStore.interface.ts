import {
  PérimètreGéographiqueIdentifiant,
} from '@/components/_commons/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique.interface';

export type NiveauDeMaille = 'régionale' | 'départementale';

export default interface SélecteursPageChantiersStore {
  niveauDeMaille: NiveauDeMaille
  setNiveauDeMaille: (niveauDeMaille: NiveauDeMaille) => void
  périmètreGéographique: PérimètreGéographiqueIdentifiant
  setPérimètreGéographique: (périmètreGéographiqueIdentifiant: PérimètreGéographiqueIdentifiant) => void
  réinitialisePérimètreGéographique: () => void
}
