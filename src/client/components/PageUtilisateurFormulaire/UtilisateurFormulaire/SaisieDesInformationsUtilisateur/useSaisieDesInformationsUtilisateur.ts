import { useCallback, useEffect, useState } from 'react';
import { actionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { ProfilCode, profilsDépartementaux, profilsRégionaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import { HabilitationsÀCréerOuMettreÀJour } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

const codesTerritoiresDROM = ['NAT-FR', 'REG-01', 'REG-02', 'REG-03', 'REG-04', 'REG-06', 'DEPT-971', 'DEPT-972', 'DEPT-973', 'DEPT-974', 'DEPT-976'];

// eslint-disable-next-line sonarjs/cognitive-complexity
export default function useSaisieDesInformationsUtilisateur(profils: Profil[], profilSélectionné: ProfilCode) {
  const { récupérerTousLesCodesTerritoires } = actionsTerritoiresStore();
  const tousLesCodesTerritoires = récupérerTousLesCodesTerritoires();
  
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

  const accèsAuChampsLectureTerritoire = profilsDépartementaux.includes(profilSélectionné) || profilsRégionaux.includes(profilSélectionné);

  const maillesÀAfficher = { 
    nationale: false, 
    régionale: profilsRégionaux.includes(profilSélectionné) ? true : false, 
    départementale: profilsDépartementaux.includes(profilSélectionné) ? true : false, 
  };

  const déterminerLesDroitsEnLectureSélectionnésParDéfaut = useCallback((profil: ProfilCode) => {
    if (profil === 'DITP_ADMIN') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: tousLesCodesTerritoires, chantiers: [], périmètres: [] } }));
    }
    if (profil === 'DITP_PILOTAGE') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: tousLesCodesTerritoires, chantiers: [], périmètres: [] } }));
    }
    if (profil === 'PR') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: tousLesCodesTerritoires, chantiers: [], périmètres: [] } }));
    }
    if (profil === 'PM_ET_CABINET') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: tousLesCodesTerritoires, chantiers: [], périmètres: [] } }));
    }
    if (profil === 'CABINET_MTFP') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: tousLesCodesTerritoires, chantiers: [], périmètres: [] } }));
    }
    if (profil === 'CABINET_MINISTERIEL') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: tousLesCodesTerritoires, chantiers: [], périmètres: [] } }));
    }
    if (profil === 'DIR_ADMIN_CENTRALE') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: tousLesCodesTerritoires, chantiers: [], périmètres: [] } }));
    }
    if (profil === 'SECRETARIAT_GENERAL') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: tousLesCodesTerritoires, chantiers: [], périmètres: [] } }));
    }
    if (profil === 'EQUIPE_DIR_PROJET') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: tousLesCodesTerritoires, chantiers: [], périmètres: [] } }));
    }
    if (profil === 'DIR_PROJET') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: tousLesCodesTerritoires, chantiers: [], périmètres: [] } }));
    }
    if (profil === 'REFERENT_REGION') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: [], chantiers: [], périmètres: [] } }));
    }
    if (profil === 'PREFET_REGION') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: [], chantiers: [], périmètres: [] } }));
    }
    if (profil === 'SERVICES_DECONCENTRES_REGION') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: [], chantiers: [], périmètres: [] } }));
    }
    if (profil === 'PREFET_DEPARTEMENT') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: [], chantiers: [], périmètres: [] } }));
    }
    if (profil === 'REFERENT_DEPARTEMENT') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: [], chantiers: [], périmètres: [] } }));
    }
    if (profil === 'SERVICES_DECONCENTRES_DEPARTEMENT') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: [], chantiers: [], périmètres: [] } }));
    }
    if (profil === 'DROM') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: codesTerritoiresDROM, chantiers: [], périmètres: [] } }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    déterminerLesDroitsEnLectureSélectionnésParDéfaut(profilSélectionné);
  }, [déterminerLesDroitsEnLectureSélectionnésParDéfaut, profilSélectionné]);

  return {
    listeProfils,
    habilitationsParDéfaut,
    accèsAuChampsLectureTerritoire,
    maillesÀAfficher,
  };
}
