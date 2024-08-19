import '@gouvfr/dsfr/dist/component/table/table.min.css';
import { FunctionComponent, useEffect } from 'react';
import useTableauPageAdminUtilisateurs
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/useTableauAdminUtilisateurs';
import TableauEnTête from '@/components/_commons/Tableau/EnTête/TableauEnTête';
import TableauPagination from '@/components/_commons/Tableau/Pagination/TableauPagination';
import TableauAdminUtilisateursStyled
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/TableauAdminUtilisateurs.styled';
import BarreDeRecherche from '@/components/_commons/BarreDeRecherche/BarreDeRecherche';
import Titre from '@/components/_commons/Titre/Titre';
import TableauAdminUtilisateursContenu
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/Contenu/TableauAdminUtilisateursContenu';
import Loader from '@/components/_commons/Loader/Loader';
import { UtilisateurContrat } from '@/server/gestion-utilisateur/app/contrats/UtilisateurContrat';

const TableauAdminUtilisateurs: FunctionComponent<{}> = () => {
  const {
    tableau,
    estEnChargement,
    changementDePageCallback,
    changementDeLaRechercheCallback,
    valeurDeLaRecherche,
  } = useTableauPageAdminUtilisateurs();

  useEffect(() => {
    tableau.setPageSize(20);
  }, [tableau]);

  return (
    <TableauAdminUtilisateursStyled className='fr-px-1w'>
      <div className='barre-de-recherche fr-mt-2w'>
        <BarreDeRecherche
          changementDeLaRechercheCallback={changementDeLaRechercheCallback}
          valeur={valeurDeLaRecherche}
        />
      </div>
      {
        estEnChargement ? <Loader /> :
        <>
          <Titre
            baliseHtml='h2'
            className='fr-h4 fr-mt-3w  fr-mb-0 titre-tableau'
          >
            {tableau.getFilteredRowModel().rows.length}
            {' '}
            {tableau.getFilteredRowModel().rows.length > 1 ? 'comptes' : 'compte'}
          </Titre>
          <div className='fr-table'>
            <table className='tableau fr-m-0 fr-p-0'>
              <caption className='fr-sr-only'>
                Tableau des utilisateurs
              </caption>
              <TableauEnTête<UtilisateurContrat> tableau={tableau} />
              <TableauAdminUtilisateursContenu tableau={tableau} />
            </table>
            <TableauPagination
              changementDePageCallback={changementDePageCallback}
              nombreDePages={tableau.getPageCount()}
              numéroDePageInitiale={1}
            />
          </div>
        </>
      }
    </TableauAdminUtilisateursStyled>
  );
};

export default TableauAdminUtilisateurs;
