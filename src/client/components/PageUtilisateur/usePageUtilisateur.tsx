import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { actionsTerritoiresStore, territoiresTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Scope, scopes } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default function usePageUtilisateur(utilisateur: Utilisateur, chantiers: Record<Chantier['id'], Chantier['nom']>) {

  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const tousLesTerritoires = territoiresTerritoiresStore();

  const scopesParDéfaut: { [key in Scope] : string[] } = {
    lecture: [],
    'saisie.indicateur': [],
    'saisie.commentaire': [],
    'utilisateurs.lecture': [],
    'utilisateurs.modification': [],
    'utilisateurs.suppression': [],
  };

  let listeTerritoiresScope = { ...scopesParDéfaut };
  let listeChantiersScope = { ...scopesParDéfaut };

  scopes.forEach(scope => {
    const territoiresScopeUtilisateur = utilisateur.habilitations[scope].territoires;
    listeTerritoiresScope[scope] = territoiresScopeUtilisateur.length === tousLesTerritoires.length
      ? ['Tous']
      : territoiresScopeUtilisateur.map(
        territoire => (
          utilisateur.profil === 'DROM' && territoire === 'NAT-FR'
            ? 'Ensemble des 5 DROMS'
            : récupérerDétailsSurUnTerritoire(territoire).nomAffiché
        ),
      );

    const chantiersScopeUtilisateur = utilisateur.habilitations[scope].chantiers;
    listeChantiersScope[scope] = chantiersScopeUtilisateur.length === Object.keys(chantiers).length
      ? ['Tous']
      : chantiersScopeUtilisateur.map(chantierId => chantiers[chantierId]);
  });

  return {
    listeTerritoiresScope,
    listeChantiersScope,
  };
}
