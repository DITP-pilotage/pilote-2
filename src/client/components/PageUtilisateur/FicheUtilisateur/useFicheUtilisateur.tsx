import { useCallback, useEffect, useState } from 'react';
import { actionsTerritoiresStore, départementsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { ScopeChantiers } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import api from '@/server/infrastructure/api/trpc/api';
import { profilsRégionaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import FicheUtilisateurProps from './FicheUtilisateur.interface';

export default function useFicheUtilisateur(utilisateur: FicheUtilisateurProps['utilisateur']) {
  const départements = départementsTerritoiresStore();
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const { data: chantiers } = api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const { data: profil } = api.profil.récupérer.useQuery({ profilCode: utilisateur.profil }, { staleTime: Number.POSITIVE_INFINITY });

  const [scopes, setScopes] = useState<{ [key in (ScopeChantiers | 'gestionUtilisateur')]: { chantiers: Chantier['nom'][], territoires: Territoire['nomAffiché'][] } }>({
    lecture: {
      chantiers: [],
      territoires: [],
    },
    saisieIndicateur: {
      chantiers: [],
      territoires: [],
    },
    saisieCommentaire: {
      chantiers: [],
      territoires: [],
    },
    gestionUtilisateur: {
      chantiers: [],
      territoires: [],
    },
  });

  const déterminerLesNomÀAfficherPourLesTerritoiresLecture = useCallback((u: FicheUtilisateurProps['utilisateur']) => {
    if (profil?.code === 'DROM')
      return ['Ensemble des 5 DROMS'];

    if (profil?.chantiers.lecture.tousTerritoires)
      return ['Tous les territoires']; 

    if (profil && profilsRégionaux.includes(profil.code)) {
      const régionsSaisies = u?.habilitations?.lecture?.territoires?.filter(territoireCode => territoireCode.startsWith('REG')) ?? [];
      const départementsEnfantsDesRégionsSaisies = régionsSaisies.flatMap(régionCode => départements.filter(d => d.codeParent === régionCode).map(d => d.nomAffiché));
  
      return [...régionsSaisies.map(code => récupérerDétailsSurUnTerritoire(code).nomAffiché), ...départementsEnfantsDesRégionsSaisies];
    }

    return u.habilitations?.lecture?.territoires?.map(territoire => récupérerDétailsSurUnTerritoire(territoire).nomAffiché) ?? [];
  }, [départements, profil, récupérerDétailsSurUnTerritoire]);

  const déterminerLesNomÀAfficherPourLesChantiersLecture = useCallback((u: FicheUtilisateurProps['utilisateur']) => {
    
    if (profil?.code === 'DROM')
      return ['Tous les chantiers territorialisés', 'Tous les chantiers DROM'];  
  
    if (profil?.chantiers.lecture.tous)
      return ['Tous les chantiers']; 

    if (profil?.chantiers.lecture.tousTerritorialisés)
      return ['Tous les chantiers territorialisés'];

    return u.habilitations?.lecture?.chantiers?.map(chantierId => chantiers?.find(c => c.id === chantierId)?.nom ?? '') ?? [];
  }, [profil, chantiers]);

  const déterminerLesNomÀAfficherPourLesTerritoiresSaisieIndicateur = useCallback((u: FicheUtilisateurProps['utilisateur']) => {
    
    return u.saisieIndicateur ? déterminerLesNomÀAfficherPourLesTerritoiresLecture(u) : [];

  }, [déterminerLesNomÀAfficherPourLesTerritoiresLecture]);

  const déterminerLesNomÀAfficherPourLesChantiersSaisieIndicateur = useCallback((u: FicheUtilisateurProps['utilisateur']) => {
    
    return u.saisieIndicateur ? déterminerLesNomÀAfficherPourLesChantiersLecture(u) : [];

  }, [déterminerLesNomÀAfficherPourLesChantiersLecture]);

  const déterminerLesNomÀAfficherPourLesTerritoiresSaisieCommentaire = useCallback((u: FicheUtilisateurProps['utilisateur']) => {
    if (u.saisieCommentaire) {
      if (['SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET'].includes(profil?.code ?? ''))
        return ['France', 'Régions (uniquement les chantiers hors ate centralisés)', 'Départements (uniquement les chantiers hors ate centralisés)'];

      if (['DITP_PILOTAGE', 'DROM'].includes(profil?.code ?? ''))
        return ['France'];

      return déterminerLesNomÀAfficherPourLesTerritoiresLecture(u);
    } else {
      return [];
    }
    
  }, [déterminerLesNomÀAfficherPourLesTerritoiresLecture, profil]);

  const déterminerLesNomÀAfficherPourLesTerritoiresGestionUtilisateur = useCallback((u: FicheUtilisateurProps['utilisateur']) => {
    return u.gestionUtilisateur ? déterminerLesNomÀAfficherPourLesTerritoiresLecture(u) : [];
    
  }, [déterminerLesNomÀAfficherPourLesTerritoiresLecture]);

  const déterminerLesNomÀAfficherPourLesChantiersSaisieCommentaire = useCallback((u: FicheUtilisateurProps['utilisateur']) => {
    if (u.saisieCommentaire) {

      if (['REFERENT_REGION', 'PREFET_REGION', 'REFERENT_DEPARTEMENT', 'PREFET_DEPARTEMENT'].includes(profil?.code ?? ''))
        return ['Tous les chantiers ATE territorialisés']; 

      if (['RESPONSABLE_REGION', 'SERVICES_DECONCENTRES_REGION', 'RESPONSABLE_DEPARTEMENT', 'SERVICES_DECONCENTRES_DEPARTEMENT'].includes(profil?.code ?? '')) {
        const chantiersFiltrés = chantiers
          ?.filter(c => u.habilitations?.lecture?.chantiers?.includes(c.id) && c.ate !== 'hors_ate_centralise')
          .map(chantier => chantier.nom); 

        return chantiersFiltrés ?? [];
      }

      return déterminerLesNomÀAfficherPourLesChantiersLecture(u);
    } else {
      return [];
    }

  }, [déterminerLesNomÀAfficherPourLesChantiersLecture, chantiers, profil]);

  const déterminerLesNomÀAfficherPourLesChantiersGestionDesUtilisateurs = useCallback((u: FicheUtilisateurProps['utilisateur']) => {
    if (u.gestionUtilisateur) {
      if (['DITP_ADMIN', 'DITP_PILOTAGE'].includes(profil?.code ?? ''))
        return ['Tous les chantiers'];

      if (['REFERENT_REGION', 'REFERENT_DEPARTEMENT'].includes(profil?.code ?? ''))
        return ['Tous les chantiers ATE territorialisés']; 

      return déterminerLesNomÀAfficherPourLesChantiersLecture(u);
    } else {
      return [];
    }

  }, [déterminerLesNomÀAfficherPourLesChantiersLecture, profil]);

  useEffect(() => {
    if (!chantiers || !profil)
      return;
    
    const nouveauScopes = {
      lecture: {
        chantiers: déterminerLesNomÀAfficherPourLesChantiersLecture(utilisateur),
        territoires: déterminerLesNomÀAfficherPourLesTerritoiresLecture(utilisateur),
      },
      saisieIndicateur: {
        chantiers: déterminerLesNomÀAfficherPourLesChantiersSaisieIndicateur(utilisateur),
        territoires: déterminerLesNomÀAfficherPourLesTerritoiresSaisieIndicateur(utilisateur),
      },
      saisieCommentaire: {
        chantiers: déterminerLesNomÀAfficherPourLesChantiersSaisieCommentaire(utilisateur),
        territoires: déterminerLesNomÀAfficherPourLesTerritoiresSaisieCommentaire(utilisateur),
      },
      gestionUtilisateur: {
        chantiers: déterminerLesNomÀAfficherPourLesChantiersGestionDesUtilisateurs(utilisateur),
        territoires: déterminerLesNomÀAfficherPourLesTerritoiresGestionUtilisateur(utilisateur),
      },
    };

    setScopes(nouveauScopes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chantiers, profil]);

  return {
    scopes,
  };
}
