import { ReactNode } from 'react';
import Météo from '@/server/domain/chantier/Météo.interface';
import Hachure from '@/client/constants/nuanciers/hachure/hachure';

export type NuancierRemplissage = {
  type: 'COULEUR',
  couleur: string,
} | {
  type: 'HACHURES',
  hachure: Hachure,
};

export const remplissageParDéfaut: NuancierRemplissage = {
  type: 'COULEUR',
  couleur: '#bababa',
} as const;

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
