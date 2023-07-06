import { useEffect, useState } from 'react';
import { actionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { profilsDépartementaux, profilsRégionaux } from '@/server/domain/utilisateur/Utilisateur.interface';

export default function useHabilitationsTerritoires(profil?: Profil) {
  const { récupérerCodesDépartementsAssociésÀLaRégion } = actionsTerritoiresStore();
  const [afficherChampLectureTerritoires, setAfficherChampLectureTerritoires] = useState(false);
  const [groupesÀAfficher, setGroupesÀAfficher] = useState<{ nationale: boolean, régionale: boolean, départementale: boolean }>({
    nationale: false, 
    régionale: false, 
    départementale: false,
  });

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

  useEffect(() => {
    setAfficherChampLectureTerritoires(!!profil && (profilsDépartementaux.includes(profil.code) || profilsRégionaux.includes(profil.code)));
  }, [profil]);

  useEffect(() => {
    if (profil) {
      setGroupesÀAfficher({
        nationale: false,
        régionale: afficherChampLectureTerritoires && profilsRégionaux.includes(profil.code),
        départementale: afficherChampLectureTerritoires && profilsDépartementaux.includes(profil.code),
      });
    }
  }, [profil, afficherChampLectureTerritoires]);

  return {
    déterminerLesTerritoiresSélectionnés,
    afficherChampLectureTerritoires,
    groupesÀAfficher,
  };
}
