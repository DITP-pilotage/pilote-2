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
import InputFichier from '@/components/_commons/InputFichier/InputFichier';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';
import Alerte from '@/components/_commons/Alerte/Alerte';

export function TableauAdminIndicateurs() {
  const {
    tableau,
    file,
    alerte,
    définirLeFichier,
    verifierLeFichier,
    estEnChargement,
    changementDePageCallback,
    changementDeLaRechercheCallback,
    valeurDeLaRecherche,
    exporterLesIndicateurs,
  } = useTableauPageAdminIndicateurs();

  return (
    <TableauAdminIndicateursStyled>
      {
        !!alerte && (
          <div className='fr-mt-2w'>
            <Alerte
              titre={alerte.titre}
              type={alerte.type}
            />
          </div>
        )
      }
      <div className='fr-mt-2w flex justify-between w-full'>
        <div className='barre-de-recherche'>
          <BarreDeRecherche
            changementDeLaRechercheCallback={changementDeLaRechercheCallback}
            valeur={valeurDeLaRecherche}
          />
        </div>
        <form
          className='flex align-center'
          onSubmit={verifierLeFichier}
        >
          <InputFichier
            accept='.csv'
            onChange={définirLeFichier}
          />
          <SubmitBouton
            disabled={!file}
            label='Importer en masse'
          />
        </form>
      </div>
      {
        estEnChargement ? <Loader /> :
        <>
          <div className='flex justify-between fr-my-2w'>
            <Titre
              baliseHtml='h2'
              className='fr-h4 fr-mb-0 titre-tableau flex align-center'
            >
              {tableau.getFilteredRowModel().rows.length}
              {' '}
              {tableau.getFilteredRowModel().rows.length > 1 ? 'indicateurs' : 'indicateur'}
            </Titre>
            <div>
              <button
                className='fr-btn fr-text'
                disabled={tableau.getFilteredRowModel().rows.length === 0}
                onClick={exporterLesIndicateurs}
                type='button'
              >
                Exporter
                {' '}
                {`${tableau.getFilteredRowModel().rows.length === 1 ? "l'indicateur" : `les ${tableau.getFilteredRowModel().rows.length} indicateurs` }`}
              </button>
            </div>
          </div>
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
