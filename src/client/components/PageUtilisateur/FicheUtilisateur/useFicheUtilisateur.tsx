import { useCallback, useEffect, useState } from 'react';
import { actionsTerritoiresStore, territoiresTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { ScopeChantiers } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { objectEntries } from '@/client/utils/objects/objects';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import api from '@/server/infrastructure/api/trpc/api';
import FicheUtilisateurProps from './FicheUtilisateur.interface';

export default function useFicheUtilisateur(utilisateur: FicheUtilisateurProps['utilisateur']) {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const tousLesTerritoires = territoiresTerritoiresStore();
  const { data: chantiers } = api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });

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

  const déterminerLesNomÀAfficherPourLesTerritoires = (territoiresCodesAccessibles: string[]) => {
    if (territoiresCodesAccessibles.length === tousLesTerritoires.length)
      return ['Tous les territoires'];
    
    if (utilisateur.profil === 'DROM') {
      return territoiresCodesAccessibles.map(territoire => {
        if (territoire === 'NAT-FR') 
          return 'Ensemble des 5 DROMS';
        
        return récupérerDétailsSurUnTerritoire(territoire).nomAffiché;
      });
    }

    return territoiresCodesAccessibles.map(territoire => récupérerDétailsSurUnTerritoire(territoire).nomAffiché);
  };

  const déterminerLesNomÀAfficherPourLesChantiers = useCallback((chantiersIdsAccessibles: string[]) => {
    if (!chantiers) 
      return [];

    const chantiersTerritorialisésIds = chantiers.filter(chantier => chantier.estTerritorialisé).map(c => c.id); 

    if (chantiersIdsAccessibles.length === chantiers.length)
      return ['Tous les chantiers'];
    
    if (chantiersTerritorialisésIds.every(chantierId => chantiersIdsAccessibles.includes(chantierId)))
      return ['Tous les chantiers territorialisés'];

    return chantiersIdsAccessibles.map(chantierId => chantiers.find(c => c.id === chantierId)?.nom ?? '');
  }, [chantiers]);

  useEffect(() => {
    if (!chantiers)
      return;
    
    let nouveauScopes: typeof scopes = structuredClone(scopes);

    objectEntries(scopes).forEach(([scope, _]) => {
      nouveauScopes[scope].territoires = déterminerLesNomÀAfficherPourLesTerritoires(utilisateur.habilitations[scope].territoires);
      nouveauScopes[scope].chantiers = déterminerLesNomÀAfficherPourLesChantiers(utilisateur.habilitations[scope].chantiers);
    });

    setScopes(nouveauScopes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chantiers]);
  

  return {
    scopes,
  };
}
