import { useCallback, useEffect, useState } from 'react';
import {
  actionsTerritoiresStore,
  départementsTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { ScopeChantiers, ScopeUtilisateurs } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import api from '@/server/infrastructure/api/trpc/api';
import { profilsRégionaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import {
  AAccesATousLesUtilisateurs,
} from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/useSaisieDesInformationsUtilisateur';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import FicheUtilisateurProps from './FicheUtilisateur.interface';

export default function useFicheUtilisateur(utilisateur: FicheUtilisateurProps['utilisateur']) {
  const départements = départementsTerritoiresStore();
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const { data: chantiers } = api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const { data: profil } = api.profil.récupérer.useQuery({ profilCode: utilisateur.profil }, { staleTime: Number.POSITIVE_INFINITY });

  const [scopes, setScopes] = useState<{
    [key in (ScopeChantiers | ScopeUtilisateurs)]: {
      chantiers: Chantier['nom'][],
      territoires: Territoire['nomAffiché'][]
    }
  }>({
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
        responsabilite: {
          chantiers: [],
          territoires: [],
        },
      });

  const déterminerLesNomÀAfficherPourLesTerritoiresLecture = useCallback((u: FicheUtilisateurProps['utilisateur']) => {
    if (profil?.code === ProfilEnum.DROM)
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

    if (profil?.code === ProfilEnum.DROM)
      return ['Tous les chantiers territorialisés', 'Tous les chantiers DROM'];

    if (profil?.chantiers.lecture.tous)
      return ['Tous les chantiers'];

    if (profil?.chantiers.lecture.tousTerritorialisés)
      return ['Tous les chantiers territorialisés'];

    return u.habilitations?.lecture?.chantiers?.map(chantierId => chantiers?.find(c => c.id === chantierId)?.nom ?? '') ?? [];
  }, [profil, chantiers]);

  const déterminerLesNomÀAfficherPourLesChantiersResponsabilite = (u: FicheUtilisateurProps['utilisateur']) => {
    
    return u.habilitations?.responsabilite?.chantiers?.map(chantierId => chantiers?.find(c => c.id === chantierId)?.nom ?? '') ?? [];
  };

  const déterminerLesNomÀAfficherPourLesTerritoiresSaisieIndicateur = useCallback((u: FicheUtilisateurProps['utilisateur']) => {

    return u.saisieIndicateur ? déterminerLesNomÀAfficherPourLesTerritoiresLecture(u) : [];

  }, [déterminerLesNomÀAfficherPourLesTerritoiresLecture]);

  const déterminerLesNomÀAfficherPourLesChantiersSaisieIndicateur = useCallback((u: FicheUtilisateurProps['utilisateur']) => {

    return u.saisieIndicateur ? déterminerLesNomÀAfficherPourLesChantiersLecture(u) : [];

  }, [déterminerLesNomÀAfficherPourLesChantiersLecture]);

  const déterminerLesNomÀAfficherPourLesTerritoiresSaisieCommentaire = useCallback((u: FicheUtilisateurProps['utilisateur']) => {
    if (u.saisieCommentaire) {
      if ([ProfilEnum.SECRETARIAT_GENERAL, ProfilEnum.EQUIPE_DIR_PROJET, ProfilEnum.DIR_PROJET].includes(profil?.code ?? ''))
        return ['France', 'Régions (uniquement les chantiers hors ate centralisés)', 'Départements (uniquement les chantiers hors ate centralisés)'];

      if ([ProfilEnum.DITP_PILOTAGE, ProfilEnum.DROM].includes(profil?.code ?? ''))
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

      if ([ProfilEnum.COORDINATEUR_REGION, ProfilEnum.PREFET_REGION, ProfilEnum.COORDINATEUR_DEPARTEMENT, ProfilEnum.PREFET_DEPARTEMENT].includes(profil?.code ?? ''))
        return ['Tous les chantiers ATE territorialisés'];

      if ([ProfilEnum.SERVICES_DECONCENTRES_REGION, ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT].includes(profil?.code ?? '')) {
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
      if (AAccesATousLesUtilisateurs(profil ?? null))
        return ['Tous les chantiers'];

      if ([ProfilEnum.COORDINATEUR_REGION, ProfilEnum.COORDINATEUR_DEPARTEMENT].includes(profil?.code ?? ''))
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
      responsabilite: {
        chantiers: déterminerLesNomÀAfficherPourLesChantiersResponsabilite(utilisateur),
        territoires: déterminerLesNomÀAfficherPourLesTerritoiresLecture(utilisateur),
      },      
    };

    setScopes(nouveauScopes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chantiers, profil]);

  return {
    scopes,
  };
}
