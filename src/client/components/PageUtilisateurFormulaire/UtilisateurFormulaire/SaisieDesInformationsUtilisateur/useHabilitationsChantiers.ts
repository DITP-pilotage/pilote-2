import { useCallback } from 'react';
import { Profil } from '@/server/domain/profil/Profil.interface';
import api from '@/server/infrastructure/api/trpc/api';
import { auMoinsUneValeurDuTableauEstContenueDansLAutreTableau } from '@/client/utils/arrays';

export default function useHabilitationsChantiers(profil: Profil) {
  const { data: chantiers } = api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  
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
    if (!chantiers) return [];

    const chantiersAppartenantsAuPérimètresMinistérielsSélectionnés = chantiers.filter(chantier => auMoinsUneValeurDuTableauEstContenueDansLAutreTableau(chantier.périmètreIds, périmètresMinistérielsIdsSélectionnés));
    return chantiersAppartenantsAuPérimètresMinistérielsSélectionnés.map(c => c.id);
  }, [chantiers]);

  const masquerLeChampLectureChantiers = !profil || profil.code === 'DROM' || profil?.chantiers.lecture.tous || profil?.chantiers.lecture.tousTerritorialisés;

  return {
    masquerLeChampLectureChantiers,
    déterminerLesChantiersSélectionnésParDéfaut,
    déterminerLesChantiersSélectionnés,
  };
}
