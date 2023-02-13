import { TerritoireIdentifiant } from '@/server/domain/chantier/Chantier.interface';

export type NiveauDeMaille = 'régionale' | 'départementale';

export default interface SélecteursPageChantiersStore {
  niveauDeMaille: NiveauDeMaille
  setNiveauDeMaille: (niveauDeMaille: NiveauDeMaille) => void
  périmètreGéographique: TerritoireIdentifiant
  setPérimètreGéographique: (périmètreGéographiqueIdentifiant: TerritoireIdentifiant) => void
  réinitialisePérimètreGéographique: () => void
}
