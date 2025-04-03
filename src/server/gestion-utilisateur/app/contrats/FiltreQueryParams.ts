import { ProfilCode } from '@/server/gestion-utilisateur/domain/Utilisateur';

export type FiltreQueryParams = {
  territoires: string[]
  perimetresMinisteriels: string[]
  chantiers: string[]
  profils: ProfilCode[]
  typeCompte: ('actif' | 'desactive')[]
  chantiersAssociésAuxPérimètres: string[]
};

export type SortingParams = {
  desc: boolean;
  id: string;
};
