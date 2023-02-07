import { ReactNode } from 'react';
import Météo from '@/server/domain/chantier/Météo.interface';

export const remplissageParDéfaut = {
  type: 'COULEUR',
  valeur: '#bababa',
} as const;

export type NuancierRemplissage = {
  type: 'COULEUR',
  valeur: string,
} | {
  type: 'HACHURES',
  valeur: 'hachures-gris-blanc',
};

export type NuancierPourcentage = {
  seuil: number | null,
  libellé: string,
  remplissage: NuancierRemplissage,
}[];

export type NuancierMétéo = {
  valeur: Météo,
  libellé: string,
  remplissage: NuancierRemplissage,
  picto?: ReactNode,
}[];
