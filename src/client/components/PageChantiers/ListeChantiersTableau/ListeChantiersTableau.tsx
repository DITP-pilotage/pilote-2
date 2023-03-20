import '@gouvfr/dsfr/dist/component/table/table.min.css';
import '@gouvfr/dsfr/dist/component/notice/notice.min.css';
import { useEffect } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import BarreDeRecherche from '@/components/_commons/BarreDeRecherche/BarreDeRecherche';
import TableauPagination from '@/components/_commons/Tableau/TableauPagination/TableauPagination';
import ListeChantiersTableauContenu from '@/components/PageChantiers/ListeChantiersTableau/TableauContenu/ListeChantiersTableauContenu';
import ListeChantiersTableauProps from './ListeChantiersTableau.interface';
import ListeChantiersTableauEnTête from './TableauEnTête/ListeChantiersTableauEnTête';
import ListeChantiersTableauStyled from './ListeChantiersTableau.styled';
import useListeChantiersTableau from './useListeChantiersTableau';


export default function ListeChantiersTableau({ colonnes, données }: ListeChantiersTableauProps) {
  const { tableau, changementDeLaRechercheCallback, changementDePageCallback, valeurDeLaRecherche } = useListeChantiersTableau(données, colonnes);
  
  useEffect(() => {
    tableau.setPageSize(50);
  }, [tableau]);

  return (
    <ListeChantiersTableauStyled className='fr-table fr-m-0 fr-p-0'>
      <Titre
        baliseHtml="h2"
        className="fr-h6"
      >
        {`Liste des chantiers (${tableau.getFilteredRowModel().rows.length})`}
      </Titre>
      <div className='tableau-actions fr-mb-3v fr-mt-1w'>
        <BarreDeRecherche
          changementDeLaRechercheCallback={changementDeLaRechercheCallback}
          valeur={valeurDeLaRecherche}
        />
        <div className="fr-toggle fr-ml-4w">
          <input
            className="fr-toggle__input"
            id="interrupteur-grouper-par-ministères"
            onChange={tableau.getColumn('porteur')?.getToggleGroupingHandler() ?? undefined}
            type="checkbox"
          />
          <label
            className="fr-toggle__label fr-pl-1w"
            htmlFor="interrupteur-grouper-par-ministères"
          >
            Grouper par ministères
          </label>
        </div>
      </div>
      {tableau.getRowModel().rows.length === 0
        ?
          <div className="fr-notice fr-notice--info">
            <div className="fr-container">
              <div className="fr-notice__body">
                <p className="fr-notice__title">
                  Aucun chantier ne correspond à votre recherche !
                </p>
                Vous pouvez modifier vos filtres pour élargir votre recherche.
              </div>
            </div>
          </div>
        :
          <>
            <table className='tableau'>
              <caption className="fr-sr-only">
                Liste des chantiers
              </caption>
              <ListeChantiersTableauEnTête tableau={tableau} />
              <ListeChantiersTableauContenu tableau={tableau} />
            </table>
            <TableauPagination
              changementDePageCallback={changementDePageCallback}
              nombreDePages={tableau.getPageCount()}
              numéroDePageInitiale={1}
            />
          </>}
    </ListeChantiersTableauStyled>
  );
}
