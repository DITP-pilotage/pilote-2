import '@gouvfr/dsfr/dist/component/table/table.min.css';
import Titre from '@/components/_commons/Titre/Titre';
import DétailsDroitsUtilisateur from '@/components/PageUtilisateur/DétailsDroitsUtilisateur/DétailsDroitsUtilisateur';
import TableauUtilisateur from '@/components/PageUtilisateur/TableauUtilisateur/TableauUtilisateur';
import usePageUtilisateur from '@/components/PageUtilisateur/FicheUtilisateur/useFicheUtilisateur';
import FicheUtilisateurStyled from '@/components/PageUtilisateur/FicheUtilisateur/FicheUtilisateur.styled';
import FicheUtilisateurProps from './FicheUtilisateur.interface';

export default function FicheUtilisateur({ utilisateur, chantiers }: FicheUtilisateurProps) {
  const { scopes } = usePageUtilisateur(utilisateur, chantiers);

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
        titre='Droits de visualisation'
      />
      <DétailsDroitsUtilisateur
        chantiers={scopes['saisie.indicateur'].chantiers}
        territoires={scopes['saisie.indicateur'].territoires}
        titre='Droits de saisie des données quantitatives'
      />
      <DétailsDroitsUtilisateur
        chantiers={scopes['saisie.commentaire'].chantiers}
        territoires={scopes['saisie.commentaire'].territoires}
        titre='Droits de saisie des commentaires'
      />
    </FicheUtilisateurStyled>
  );
}
