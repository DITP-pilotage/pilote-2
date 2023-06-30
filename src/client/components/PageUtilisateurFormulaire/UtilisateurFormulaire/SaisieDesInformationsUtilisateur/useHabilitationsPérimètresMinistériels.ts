import { useCallback } from 'react';
import { Profil } from '@/server/domain/profil/Profil.interface';

export default function useHabilitationsPérimètresMinistériels(profil: Profil) {
  const déterminerLesPérimètresMinistérielsSélectionnésParDéfaut = useCallback(() => {    
    if (profil?.code === 'DROM') 
      return ['PER-018'];

    return [];
  }, [profil]);

  const masquerLeChampLecturePérimètresMinistériels = !profil || profil.code === 'DROM' || profil?.chantiers.lecture.tous || profil?.chantiers.lecture.tousTerritorialisés;

  return {
    masquerLeChampLecturePérimètresMinistériels,
    déterminerLesPérimètresMinistérielsSélectionnésParDéfaut,
  };
}
