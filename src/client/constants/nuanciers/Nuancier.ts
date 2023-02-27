import Hachure from '@/client/constants/nuanciers/hachure/hachure';

export type NuancierRemplissage = {
  type: 'COULEUR',
  couleur: string,
} | {
  type: 'HACHURES',
  couleur: string,
  hachure: Hachure,
};

export const remplissageParDéfaut: NuancierRemplissage = {
  type: 'COULEUR',
  couleur: '#bababa',
} as const;

export default interface Nuancier {
  déterminerRemplissage(valeur: number | string | null): NuancierRemplissage;
}
