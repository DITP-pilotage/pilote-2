import '@gouvfr/dsfr/dist/component/table/table.min.css';
import useTableauPageAdminUtilisateurs
  from '@/components/PageAdminUtilisateursNew/TableauAdminUtilisateurs/useTableauAdminUtilisateurs';
import TableauEnTête from '@/components/_commons/TableauNew/EnTête/TableauEnTête';
import TableauPagination from '@/components/_commons/TableauNew/Pagination/TableauPagination';
import TableauAdminUtilisateursStyled
  from '@/components/PageAdminUtilisateursNew/TableauAdminUtilisateurs/TableauAdminUtilisateurs.styled';
import BarreDeRecherche from '@/components/_commons/BarreDeRecherche/BarreDeRecherche';
import Titre from '@/components/_commons/Titre/Titre';
import TableauAdminUtilisateursContenu
  from '@/components/PageAdminUtilisateursNew/TableauAdminUtilisateurs/Contenu/TableauAdminUtilisateursContenu';
import Loader from '@/components/_commons/Loader/Loader';
import { UtilisateurListeGestion } from '@/server/app/contrats/UtilisateurListeGestion';

export default function TableauAdminUtilisateurs() {
  const {
    nombreElementPage,
    tableau,
    estEnChargement,
    changementDeLaRechercheCallback,
    valeurDeLaRecherche,
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
          <div className='fr-table'>
            <table className='tableau fr-m-0 fr-p-0'>
              <caption className='fr-sr-only'>
                Tableau des utilisateurs
              </caption>
              <TableauEnTête<UtilisateurListeGestion> tableau={tableau} />
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
}
