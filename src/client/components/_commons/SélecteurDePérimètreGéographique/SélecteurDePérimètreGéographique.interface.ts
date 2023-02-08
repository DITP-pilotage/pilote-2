import { NiveauDeMaille } from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore.interface';
import { Maille } from '@/server/domain/chantier/Chantier.interface';

export type PérimètreGéographiqueIdentifiant = {
  codeInsee: string,
  maille: Maille,
};

export default interface SélecteurDePérimètreGéographiqueProps {
  niveauDeMaille: NiveauDeMaille,
  périmètreGéographique: PérimètreGéographiqueIdentifiant,
  setPérimètreGéographique: (périmètreGéographique: PérimètreGéographiqueIdentifiant) => void,
  libellé?: string,
}
