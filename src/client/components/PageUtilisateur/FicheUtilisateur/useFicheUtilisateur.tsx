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

  const [scopes, setScopes] = useState<{ [key in (ScopeChantiers)]: { chantiers: Chantier['nom'][], territoires: Territoire['nomAffiché'][] } }>({
    lecture: {
      chantiers: [],
      territoires: [],
    },
    'saisie.indicateur': {
      chantiers: [],
      territoires: [],
    },
    'saisie.commentaire': {
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

  const déterminerLesNomÀAfficherPourLesTerritoiresSaisieIndicateur = useCallback(() => {
    if (profil?.chantiers.saisieIndicateur.tousTerritoires)
      return ['Tous les territoires']; 

    return [];
  }, [profil]);

  const déterminerLesNomÀAfficherPourLesChantiersSaisieIndicateur = useCallback((u: FicheUtilisateurProps['utilisateur']) => {
    const chantiersAccessiblesEnLecture = déterminerLesNomÀAfficherPourLesChantiersLecture(u);

    if (chantiersAccessiblesEnLecture && profil?.chantiers.saisieIndicateur.tousTerritoires) 
      return chantiersAccessiblesEnLecture;
    
    return [];
  }, [déterminerLesNomÀAfficherPourLesChantiersLecture, profil]);

  const déterminerLesNomÀAfficherPourLesTerritoiresSaisieCommentaire = useCallback((u: FicheUtilisateurProps['utilisateur']) => {
    if (profil?.chantiers.saisieCommentaire.tousTerritoires)
      return ['Tous les territoires']; 

    if (['DITP_PILOTAGE', 'SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET', 'DROM'].includes(profil?.code ?? ''))
      return ['France'];
    
    if (['PR', 'PM_ET_CABINET', 'CABINET_MTFP', 'CABINET_MINISTERIEL', 'DIR_ADMIN_CENTRALE', 'SECRETARIAT_GENERAL'].includes(profil?.code ?? ''))
      return [];

    if (profil && profilsRégionaux.includes(profil.code)) {
      const régionsSaisies = u?.habilitations?.lecture?.territoires?.filter(territoireCode => territoireCode.startsWith('REG')) ?? [];
      const départementsEnfantsDesRégionsSaisies = régionsSaisies.flatMap(régionCode => départements.filter(d => d.codeParent === régionCode).map(d => d.nomAffiché));
    
      return [...régionsSaisies.map(code => récupérerDétailsSurUnTerritoire(code).nomAffiché), ...départementsEnfantsDesRégionsSaisies];
    }

    return u.habilitations?.lecture?.territoires?.map(territoire => récupérerDétailsSurUnTerritoire(territoire).nomAffiché) ?? [];
  }, [départements, profil, récupérerDétailsSurUnTerritoire]);

  const déterminerLesNomÀAfficherPourLesChantiersSaisieCommentaire = useCallback((u: FicheUtilisateurProps['utilisateur']) => {
    if (déterminerLesNomÀAfficherPourLesTerritoiresSaisieCommentaire(u).length === 0) 
      return [];

    if (profil && ['REFERENT_REGION', 'PREFET_REGION', 'REFERENT_DEPARTEMENT', 'PREFET_DEPARTEMENT'].includes(profil.code)) {
      return ['Tous les chantiers ATE territorialisés'];
    }

    if (profil && ['SERVICES_DECONCENTRES_REGION', 'SERVICES_DECONCENTRES_DEPARTEMENT'].includes(profil.code)) {
      return u.habilitations?.lecture?.chantiers
        ?.map(chantierId => chantiers
          ?.filter(c => c.ate === 'hors_ate_deconcentre')
          .find(c => c.id === chantierId)?.nom)
        .filter((c): c is string => c !== undefined) 
        ?? [];
    }

    return déterminerLesNomÀAfficherPourLesChantiersLecture(u);
  }, [chantiers, déterminerLesNomÀAfficherPourLesChantiersLecture, déterminerLesNomÀAfficherPourLesTerritoiresSaisieCommentaire, profil]);

  useEffect(() => {
    if (!chantiers || !profil)
      return;

    const nouveauScopes = {
      lecture: {
        chantiers: déterminerLesNomÀAfficherPourLesChantiersLecture(utilisateur),
        territoires: déterminerLesNomÀAfficherPourLesTerritoiresLecture(utilisateur),
      },
      'saisie.indicateur': {
        chantiers: déterminerLesNomÀAfficherPourLesChantiersSaisieIndicateur(utilisateur),
        territoires: déterminerLesNomÀAfficherPourLesTerritoiresSaisieIndicateur(),
      },
      'saisie.commentaire': {
        chantiers: déterminerLesNomÀAfficherPourLesChantiersSaisieCommentaire(utilisateur),
        territoires: déterminerLesNomÀAfficherPourLesTerritoiresSaisieCommentaire(utilisateur),
      },
    };

    setScopes(nouveauScopes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chantiers, profil]);

  return {
    scopes,
  };
}
