import '@gouvfr/dsfr/dist/component/table/table.min.css';
import { FunctionComponent } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import DétailsDroitsUtilisateur from '@/components/PageUtilisateur/DétailsDroitsUtilisateur/DétailsDroitsUtilisateur';
import TableauUtilisateur from '@/components/PageUtilisateur/TableauUtilisateur/TableauUtilisateur';
import useFicheUtilisateur from '@/components/PageUtilisateur/FicheUtilisateur/useFicheUtilisateur';
import FicheUtilisateurStyled from '@/components/PageUtilisateur/FicheUtilisateur/FicheUtilisateur.styled';
import FicheUtilisateurProps from './FicheUtilisateur.interface';

const FicheUtilisateur: FunctionComponent<FicheUtilisateurProps> = ({ utilisateur }) => {
  const { scopes } = useFicheUtilisateur(utilisateur);

  return (
    <FicheUtilisateurStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        Utilisateur
      </Titre>
      <TableauUtilisateur utilisateur={utilisateur} />
      <DétailsDroitsUtilisateur
        chantiers={scopes.lecture.chantiers}
        territoires={scopes.lecture.territoires}
        titre='Droits de lecture'
      />
      <DétailsDroitsUtilisateur
        chantiers={scopes.responsabilite.chantiers}
        labelChantiers='Responsabilité pour les chantiers'
        labelTerritoires='Responsabilité pour les territoires'
        territoires={scopes.responsabilite.territoires}
        titre='Responsabilité'
      />
      <DétailsDroitsUtilisateur
        chantiers={scopes['saisieIndicateur'].chantiers}
        territoires={scopes['saisieIndicateur'].territoires}
        titre='Droits de saisie des données quantitatives'
      />
      <DétailsDroitsUtilisateur
        chantiers={scopes['saisieCommentaire'].chantiers}
        territoires={scopes['saisieCommentaire'].territoires}
        titre='Droits de saisie des commentaires'
      />
      <DétailsDroitsUtilisateur
        chantiers={scopes['gestionUtilisateur'].chantiers}
        territoires={scopes['gestionUtilisateur'].territoires}
        titre='Droits de gestion des utilisateurs'
      />
    </FicheUtilisateurStyled>
  );
};

export default FicheUtilisateur;
