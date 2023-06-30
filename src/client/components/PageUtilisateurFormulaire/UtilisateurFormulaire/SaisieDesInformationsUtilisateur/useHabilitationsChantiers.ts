import { useCallback, useEffect, useState } from 'react';
import { Profil } from '@/server/domain/profil/Profil.interface';
import api from '@/server/infrastructure/api/trpc/api';
import { auMoinsUneValeurDuTableauEstContenueDansLAutreTableau } from '@/client/utils/arrays';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';

export default function useHabilitationsChantiers(profil?: Profil) {
  const { data: chantiers } = api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const [chantiersAccessiblesPourLeProfil, setChantiersAccessiblesPourLeProfil] = useState<ChantierSynthétisé[]>([]);

  useEffect(() => {
    if (!chantiers)
      return; 

    if (profil?.chantiers.lecture.tousTerritorialisés || profil?.code === 'SERVICES_DECONCENTRES_REGION' || profil?.code === 'SERVICES_DECONCENTRES_DEPARTEMENT') {
      setChantiersAccessiblesPourLeProfil(chantiers.filter(chantier => chantier.estTerritorialisé));
      return;
    }

    setChantiersAccessiblesPourLeProfil(chantiers);
  }, [chantiers, profil]);
  
  const déterminerLesChantiersSélectionnésParDéfaut = useCallback(() => {    
    if (!chantiers) return [];

    const tousLesChantiersIds = chantiers?.map(chantier => chantier.id);

    if (profil?.chantiers.lecture.tous)
      return tousLesChantiersIds;

    if (profil?.chantiers.lecture.tousTerritorialisés) 
      return chantiers?.filter(chantier => chantier.estTerritorialisé).map(c => c.id);

    return [];
  }, [profil, chantiers]);

  const déterminerLesChantiersSélectionnés = useCallback((périmètresMinistérielsIdsSélectionnés: string[]) => {
    if (!chantiersAccessiblesPourLeProfil) return [];
    
    const chantiersAppartenantsAuPérimètresMinistérielsSélectionnés = chantiersAccessiblesPourLeProfil.filter(chantier => auMoinsUneValeurDuTableauEstContenueDansLAutreTableau(chantier.périmètreIds, périmètresMinistérielsIdsSélectionnés));

    return chantiersAppartenantsAuPérimètresMinistérielsSélectionnés.map(c => c.id);
  }, [chantiersAccessiblesPourLeProfil]);

  const masquerLeChampLectureChantiers = !profil || profil.code === 'DROM' || profil?.chantiers.lecture.tous || profil?.chantiers.lecture.tousTerritorialisés;

  return {
    masquerLeChampLectureChantiers,
    déterminerLesChantiersSélectionnésParDéfaut,
    déterminerLesChantiersSélectionnés,
    chantiersAccessiblesPourLeProfil,
  };
}
