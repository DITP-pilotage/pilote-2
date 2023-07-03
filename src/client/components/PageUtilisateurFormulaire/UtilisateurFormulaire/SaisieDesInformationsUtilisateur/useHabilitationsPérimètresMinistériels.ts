import { Profil } from '@/server/domain/profil/Profil.interface';

export default function useHabilitationsPérimètresMinistériels(profil?: Profil) {
  const afficherChampLecturePérimètresMinistériels = !!profil && !profil.chantiers.lecture.tous && !profil.chantiers.lecture.tousTerritorialisés;

  return {
    afficherChampLecturePérimètresMinistériels,
  };
}
