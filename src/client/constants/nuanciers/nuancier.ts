import { Météo } from '@/server/domain/chantier/Météo.interface';

export type NuancierPourcentage = {
  seuil: number,
  libellé: string,
  couleur: string,
}[];

export type NuancierMétéo = {
  valeur: Météo,
  libellé: string,
  couleur: string,
  picto?: any,
}[];
