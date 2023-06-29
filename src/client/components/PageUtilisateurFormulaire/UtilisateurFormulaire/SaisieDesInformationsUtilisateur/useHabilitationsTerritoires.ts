import { useCallback } from 'react';
import { actionsTerritoiresStore, territoiresCodesTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { codesTerritoiresDROM } from '@/validation/utilisateur';
import { profilsDépartementaux, profilsRégionaux } from '@/server/domain/utilisateur/Utilisateur.interface';

export default function useHabilitationsTerritoires(profil: Profil) {
  const tousLesCodesTerritoires = territoiresCodesTerritoiresStore();
  const { récupérerCodesDépartementsAssociésÀLaRégion } = actionsTerritoiresStore();

  const déterminerLesTerritoiresSélectionnésParDéfaut = useCallback(() => {    
    if (profil?.code === 'DROM') 
      return codesTerritoiresDROM;

    if (profil?.chantiers.lecture.tousTerritoires)
      return tousLesCodesTerritoires;

    return [];
  }, [profil, tousLesCodesTerritoires]);

  const déterminerLesTerritoiresSélectionnés = (valeursSélectionnées: string[]) => {
    let nouvellesValeurs = valeursSélectionnées;

    valeursSélectionnées.forEach(codeTerritoireSélectionné => {
      if (codeTerritoireSélectionné.startsWith('REG')) {
        const départements = récupérerCodesDépartementsAssociésÀLaRégion(codeTerritoireSélectionné);
        nouvellesValeurs = [...new Set([...nouvellesValeurs, ...départements])];
      }
    });
    return nouvellesValeurs;
  };

  const masquerLeChampLectureTerritoires = !profil || profil.code === 'DROM' || profil.chantiers.lecture.tousTerritoires;

  const groupesÀAfficher = {
    nationale: masquerLeChampLectureTerritoires,
    régionale: masquerLeChampLectureTerritoires || profilsRégionaux.includes(profil?.code),
    départementale: masquerLeChampLectureTerritoires || profilsDépartementaux.includes(profil?.code),
  };

  return {
    déterminerLesTerritoiresSélectionnésParDéfaut,
    déterminerLesTerritoiresSélectionnés,
    masquerLeChampLectureTerritoire: masquerLeChampLectureTerritoires,
    groupesÀAfficher,
  };
}
