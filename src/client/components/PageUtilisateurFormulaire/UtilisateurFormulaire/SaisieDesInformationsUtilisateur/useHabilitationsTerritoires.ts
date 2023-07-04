import { actionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { profilsDépartementaux, profilsRégionaux } from '@/server/domain/utilisateur/Utilisateur.interface';

export default function useHabilitationsTerritoires(profil?: Profil) {
  const { récupérerCodesDépartementsAssociésÀLaRégion } = actionsTerritoiresStore();

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

  const afficherChampLectureTerritoires = !!profil && (profilsDépartementaux.includes(profil.code) || profilsRégionaux.includes(profil.code));

  const groupesÀAfficher = {
    nationale: false,
    régionale: afficherChampLectureTerritoires && profilsRégionaux.includes(profil.code),
    départementale: afficherChampLectureTerritoires && profilsDépartementaux.includes(profil.code),
  };

  return {
    déterminerLesTerritoiresSélectionnés,
    afficherChampLectureTerritoires,
    groupesÀAfficher,
  };
}
