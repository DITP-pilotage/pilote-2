import '@gouvfr/dsfr/dist/component/table/table.min.css';
import { useEffect } from 'react';
import TableauAdminUtilisateursProps
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/TableauAdminUtilisateursProps.interface';
import useTableauPageAdminUtilisateurs
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/useTableauAdminUtilisateurs';
import TableauEnTête from '@/components/_commons/Tableau/EnTête/TableauEnTête';
import TableauPagination from '@/components/_commons/Tableau/Pagination/TableauPagination';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import TableauAdminUtilisateursStyled
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/TableauAdminUtilisateurs.styled';
import BarreDeRecherche from '@/components/_commons/BarreDeRecherche/BarreDeRecherche';
import Titre from '@/components/_commons/Titre/Titre';
import TableauAdminUtilisateursContenu
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/Contenu/TableauAdminUtilisateursContenu';

export default function TableauAdminUtilisateurs({ utilisateurs } :TableauAdminUtilisateursProps) {

  const { tableau, changementDePageCallback, changementDeLaRechercheCallback, valeurDeLaRecherche } = useTableauPageAdminUtilisateurs(utilisateurs);

  useEffect(() => {
    tableau.setPageSize(20);
  }, [tableau]);

  return (
    <TableauAdminUtilisateursStyled className='fr-px-1w'>
      <div className="barre-de-recherche fr-mt-2w">
        <BarreDeRecherche
          changementDeLaRechercheCallback={changementDeLaRechercheCallback}
          valeur={valeurDeLaRecherche}
        />
      </div>
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mt-3w  fr-mb-0 titre-tableau'
      >
        {tableau.getRowModel().rows.length}
        {' '}
        {tableau.getRowModel().rows.length > 1 ? 'comptes' : 'compte'}
      </Titre>
      <div className="fr-table">
        <table className='tableau fr-m-0 fr-p-0'>
          <caption className="fr-sr-only">
            Tableau des utilisateurs
          </caption>
          <TableauEnTête<Utilisateur> tableau={tableau} />
          <TableauAdminUtilisateursContenu tableau={tableau} />
        </table>
        <TableauPagination
          changementDePageCallback={changementDePageCallback}
          nombreDePages={tableau.getPageCount()}
          numéroDePageInitiale={1}
        />
      </div>
    </TableauAdminUtilisateursStyled>
  );
}
