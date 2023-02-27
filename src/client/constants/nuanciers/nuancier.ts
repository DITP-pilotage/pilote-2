import { ReactNode } from 'react';
import Hachure from '@/client/constants/nuanciers/hachure/hachure';
import { Météo } from '@/server/domain/météo/Météo.interface';

export type NuancierRemplissage = {
  type: 'COULEUR',
  couleur: string,
} | {
  type: 'HACHURES',
  couleur: string,
  hachure: Hachure,
};

// TODO refacto nuancier ?

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

export type NuancierDégradé = {
  couleurDépart: string,
  couleurArrivé: string,
  récupérerRemplissage: (valeurMin: number, valeurMax: number, valeur: number | null) => NuancierRemplissage
};
