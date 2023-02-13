import { NiveauDeMaille } from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore.interface';
import { TerritoireIdentifiant } from '@/server/domain/chantier/Chantier.interface';

export default interface SélecteurDePérimètreGéographiqueProps {
  niveauDeMaille: NiveauDeMaille,
  périmètreGéographique: TerritoireIdentifiant,
  setPérimètreGéographique: (périmètreGéographique: TerritoireIdentifiant) => void,
}
