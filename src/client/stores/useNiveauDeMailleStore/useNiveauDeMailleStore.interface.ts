import {
  PérimètreGéographiqueIdentifiant,
} from '@/components/PageChantiers/BarreLatérale/SélecteursGéographiques/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique.interface';

export type NiveauDeMaille = 'régionale' | 'départementale';

export default interface NiveauDeMailleStore {
  niveauDeMaille: NiveauDeMaille
  setNiveauDeMaille: (niveauDeMaille: NiveauDeMaille) => void
  périmètreGéographique: PérimètreGéographiqueIdentifiant
  setPérimètreGéographique: (périmètreGéographiqueIdentifiant: PérimètreGéographiqueIdentifiant) => void
}
