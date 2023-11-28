import useTableauPageAdminIndicateurs
  from '@/components/PageAdminIndicateurs/TableauAdminIndicateurs/useTableauAdminIndicateurs';
import TableauAdminIndicateursStyled
  from '@/components/PageAdminIndicateurs/TableauAdminIndicateurs/TableauAdminIndicateurs.styled';
import BarreDeRecherche from '@/components/_commons/BarreDeRecherche/BarreDeRecherche';
import Loader from '@/components/_commons/Loader/Loader';
import Titre from '@/components/_commons/Titre/Titre';
import TableauEnTête from '@/components/_commons/Tableau/EnTête/TableauEnTête';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import TableauAdminIndicateursContenu
  from '@/components/PageAdminIndicateurs/TableauAdminIndicateurs/Contenu/TableauAdminIndicateursContenu';
import TableauPagination from '@/components/_commons/Tableau/Pagination/TableauPagination';

export function TableauAdminIndicateurs() {
  const {
    tableau,
    estEnChargement,
    changementDePageCallback,
    changementDeLaRechercheCallback,
    valeurDeLaRecherche,
  } = useTableauPageAdminIndicateurs();

  return (
    <TableauAdminIndicateursStyled>
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
              {tableau.getFilteredRowModel().rows.length > 1 ? 'indicateurs' : 'indicateur'}
            </Titre>
            <div className='fr-table'>
              <table className='tableau fr-m-0 fr-p-0'>
                <caption className='fr-sr-only'>
                  Tableau des indicateurs
                </caption>
                <TableauEnTête<MetadataParametrageIndicateurContrat> tableau={tableau} />
                <TableauAdminIndicateursContenu tableau={tableau} />
              </table>
              <TableauPagination
                changementDePageCallback={changementDePageCallback}
                nombreDePages={tableau.getPageCount()}
                numéroDePageInitiale={1}
              />
            </div>
          </>
      }
    </TableauAdminIndicateursStyled>
  );
}
