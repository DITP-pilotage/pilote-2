import { useCallback, useEffect, useState } from 'react';
import { territoiresCodesTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { ProfilCode, profilsDépartementaux, profilsRégionaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import { HabilitationsÀCréerOuMettreÀJour } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { codesTerritoiresDROM } from '@/validation/utilisateur';

export default function useSaisieDesInformationsUtilisateur(profils: Profil[], profilSélectionné?: ProfilCode) {
  const tousLesCodesTerritoires = territoiresCodesTerritoiresStore();
  
  const [habilitationsParDéfaut, setHabilitationsParDéfaut] = useState<HabilitationsÀCréerOuMettreÀJour>({
    lecture: {
      chantiers: [],
      territoires: [],
      périmètres: [],
    },
    'saisie.commentaire': {
      chantiers: [],
      territoires: [],
      périmètres: [],
    },
    'saisie.indicateur': {
      chantiers: [],
      territoires: [],
      périmètres: [],
    },
  });

  const listeProfils = profils.map(profil => ({
    libellé: profil.nom,
    valeur: profil.code,
  }));

  const accèsAuChampsLectureTerritoire = profilSélectionné ? profilsDépartementaux.includes(profilSélectionné) || profilsRégionaux.includes(profilSélectionné) : false;

  const maillesÀAfficher = { 
    nationale: false, 
    régionale: profilSélectionné && profilsRégionaux.includes(profilSélectionné) ? true : false, 
    départementale: profilSélectionné && profilsDépartementaux.includes(profilSélectionné) ? true : false, 
  };

  const déterminerLesTerritoiresSélectionnésParDéfaut = useCallback((profil?: Profil) => {
    if (!profil)
      return [];
      
    if (profil.code === 'DROM') 
      return codesTerritoiresDROM;

    if (profil.chantiers.lecture.tousTerritoires)
      return tousLesCodesTerritoires;
    
    return [];
  }, [tousLesCodesTerritoires]);

  const déterminerLesHabilitationsSélectionnéesParDéfaut = useCallback((profilCode?: ProfilCode) => {
    const profil = profils.find(p => p.code === profilCode)!;
    
    
    setHabilitationsParDéfaut(h => ({ ...h, 
      lecture: { 
        territoires: déterminerLesTerritoiresSélectionnésParDéfaut(profil), 
        chantiers: [], 
        périmètres: [], 
      }, 
    }));
  }, [déterminerLesTerritoiresSélectionnésParDéfaut, profils]);

  useEffect(() => {
    déterminerLesHabilitationsSélectionnéesParDéfaut(profilSélectionné);
  }, [déterminerLesHabilitationsSélectionnéesParDéfaut, profilSélectionné]);

  return {
    listeProfils,
    habilitationsParDéfaut,
    accèsAuChampsLectureTerritoire,
    maillesÀAfficher,
  };
}
