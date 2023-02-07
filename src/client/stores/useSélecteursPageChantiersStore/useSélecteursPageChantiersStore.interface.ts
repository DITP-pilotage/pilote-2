import {
  PérimètreGéographiqueIdentifiant,
} from '@/components/PageChantiers/Filtres/FiltresSélecteurs/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique.interface';

export type NiveauDeMaille = 'régionale' | 'départementale';

export default interface SélecteursPageChantiersStore {
  niveauDeMaille: NiveauDeMaille
  setNiveauDeMaille: (niveauDeMaille: NiveauDeMaille) => void
  périmètreGéographique: PérimètreGéographiqueIdentifiant
  setPérimètreGéographique: (périmètreGéographiqueIdentifiant: PérimètreGéographiqueIdentifiant) => void
  réinitialisePérimètreGéographique: () => void
}
