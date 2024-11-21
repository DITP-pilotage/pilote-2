import '@gouvfr/dsfr/dist/component/table/table.min.css';
import { FunctionComponent } from 'react';
import useTableauPageAdminUtilisateurs
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/useTableauAdminUtilisateurs';
import TableauEnTête from '@/components/_commons/TableauNew/EnTête/TableauEnTête';
import TableauPagination from '@/components/_commons/TableauNew/Pagination/TableauPagination';
import TableauAdminUtilisateursStyled
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/TableauAdminUtilisateurs.styled';
import BarreDeRecherche from '@/components/_commons/BarreDeRecherche/BarreDeRecherche';
import Titre from '@/components/_commons/Titre/Titre';
import TableauAdminUtilisateursContenu
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/Contenu/TableauAdminUtilisateursContenu';
import Loader from '@/components/_commons/Loader/Loader';
import { UtilisateurListeGestionContrat } from '@/server/app/contrats/UtilisateurListeGestionContrat';

const TableauAdminUtilisateurs: FunctionComponent<{}> = () => {
  const {
    nombreElementPage,
    tableau,
    estEnChargement,
    changementDeLaRechercheCallback,
    valeurDeLaRecherche,
    filtresActifs,
    modifierÉtatDuFiltre,
    setPagination,
    peutConsulterLesUtilisateursDesactives,
  } = useTableauPageAdminUtilisateurs();

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
            {`${nombreElementPage} ${tableau.getFilteredRowModel().rows.length > 1 ? 'comptes' : 'compte'}`}
          </Titre>
          {
            !!peutConsulterLesUtilisateursDesactives && 
            <div className='fr-mt-2w'>
              <button 
                className={`fr-tag fr-mr-1w ${filtresActifs.typesCompte.includes('desactive') && filtresActifs.typesCompte.includes('actif') ? 'fr-tag-active' : ''}`}
                id='tag-comptes-tous'
                key='tag-comptes-tous'
                onClick={() => {
                  setPagination({
                    pageIndex: 1,
                  });
                  modifierÉtatDuFiltre(['actif', 'desactive'], 'typesCompte');
                }}
                type='button'
              >
                Tous
              </button>
              <button 
                className={`fr-tag fr-mr-1w ${filtresActifs.typesCompte.includes('actif') && !filtresActifs.typesCompte.includes('desactive') ? 'fr-tag-active' : ''}`}
                id='tag-comptes-actifs'
                key='tag-comptes-actifs'
                onClick={() => {
                  setPagination({
                    pageIndex: 1,
                  });
                  modifierÉtatDuFiltre(['actif'], 'typesCompte');
                }}
                type='button'
              >
                Comptes actifs
              </button>
              <button 
                className={`fr-tag fr-mr-1w ${filtresActifs.typesCompte.includes('desactive') && !filtresActifs.typesCompte.includes('actif') ? 'fr-tag-active' : ''}`}
                id='tag-comptes-desactives'
                key='tag-comptes-desactives'
                onClick={() => {
                  setPagination({
                    pageIndex: 1,
                  });
                  modifierÉtatDuFiltre(['desactive'], 'typesCompte');
                }}
                type='button'
              >
                Comptes désactivés
              </button>
            </div>
          }
          <div className='fr-table'>
            <table className='tableau fr-m-0 fr-p-0'>
              <caption className='fr-sr-only'>
                Tableau des utilisateurs
              </caption>
              <TableauEnTête<UtilisateurListeGestionContrat> tableau={tableau} />
              <TableauAdminUtilisateursContenu tableau={tableau} />
            </table>
            <TableauPagination
              nombreDePages={tableau.getPageCount()}
              tableau={tableau}
            />
          </div>
        </>
      }
    </TableauAdminUtilisateursStyled>
  );
};

export default TableauAdminUtilisateurs;

