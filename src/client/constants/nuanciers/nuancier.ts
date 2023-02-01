import Météo from '@/server/domain/chantier/Météo.interface';

export const couleurParDéfaut = '#bababa';

export type NuancierPourcentage = {
  seuil: number | null,
  libellé: string,
  couleur: string,
  hachures?: boolean
}[];

export type NuancierMétéo = {
  valeur: Météo,
  libellé: string,
  couleur: string,
  picto?: any,
}[];
