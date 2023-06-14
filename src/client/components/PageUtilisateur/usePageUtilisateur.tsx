import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { actionsTerritoiresStore, territoiresTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import {
  ScopeChantiers,
  ScopeUtilisateurs,
} from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { objectEntries } from '@/client/utils/objects/objects';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import PageUtilisateurProps from './PageUtilisateur.interface';

export default function usePageUtilisateur(utilisateur: Utilisateur, chantiers: PageUtilisateurProps['chantiers']) {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const tousLesTerritoires = territoiresTerritoiresStore();

  const scopes: { [key in (ScopeChantiers | ScopeUtilisateurs)]: { chantiers: Chantier['nom'][], territoires: Territoire['nomAffiché'][] } } = {
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
  };
  
  let chantiersTerritorialisésIds: string[] = objectEntries(chantiers).filter(([_, chantier]) => chantier.estTerritorialisé).map(c => c[0]);

  const aAccèsATousLesChantiers = (chantiersAccessibles: string[]) => {
    return chantiersAccessibles.length === Object.keys(chantiers).length; 
  };

  const aAccèsATousLesChantiersTerritorialisés = (chantiersAccessibles: string[]) => {
    return chantiersTerritorialisésIds.every(chantierId => chantiersAccessibles.includes(chantierId));
  };

  objectEntries(scopes).forEach(([scope, _]) => {
    const territoiresAccessibles = utilisateur.habilitations[scope].territoires;
    const chantiersAccessibles = utilisateur.habilitations[scope].chantiers;
    const chantiersAccessiblesNonTerritorialisés = chantiersAccessibles.filter(c => !chantiersTerritorialisésIds.includes(c));

    scopes[scope].territoires = territoiresAccessibles.length === tousLesTerritoires.length
      ? ['Tous les territoires']
      : territoiresAccessibles.map(
        territoire => (
          utilisateur.profil === 'DROM' && territoire === 'NAT-FR'
            ? 'Ensemble des 5 DROMS'
            : récupérerDétailsSurUnTerritoire(territoire).nomAffiché
        ),
      );

    if (aAccèsATousLesChantiers(chantiersAccessibles)) {
      scopes[scope].chantiers = ['Tous les chantiers'];
      return;
    } 
    
    if (aAccèsATousLesChantiersTerritorialisés(chantiersAccessibles))
      scopes[scope].chantiers = ['Tous les chantiers territorialisés'];  

    scopes[scope].chantiers = [...scopes[scope].chantiers, ...chantiersAccessiblesNonTerritorialisés.map(chantierId => chantiers[chantierId].nom)];
  });

  return {
    scopes,
  };
}
