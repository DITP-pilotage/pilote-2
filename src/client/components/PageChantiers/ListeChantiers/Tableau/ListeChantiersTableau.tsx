import '@gouvfr/dsfr/dist/component/table/table.min.css';
import '@gouvfr/dsfr/dist/component/notice/notice.min.css';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { getCoreRowModel, getExpandedRowModel, getFilteredRowModel,  getGroupedRowModel,  getPaginationRowModel,  getSortedRowModel,  GroupingState,  SortingState, useReactTable } from '@tanstack/react-table';
import Titre from '@/components/_commons/Titre/Titre';
import BarreDeRecherche from '@/components/_commons/BarreDeRecherche/BarreDeRecherche';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import TableauPagination from '@/components/_commons/Tableau/TableauPagination/TableauPagination';
import ListeChantiersTableauProps from './ListeChantiersTableau.interface';
import ListeChantiersTableauEnTête from './TableauEnTête/ListeChantiersTableauEnTête';
import ListeChantiersTableauContenu from './TableauContenu/ListeChantiersTableauContenu';
import ListeChantiersTableauStyled from './ListeChantiersTableau.styled';

export default function ListeChantiersTableau<T extends object>({ colonnes, données, titre, entité, afficherLesActionsTableau = true }: ListeChantiersTableauProps<T>) {
  const [tri, setTri] = useState<SortingState>([]);
  const [regroupement, setRegroupement] = useState<GroupingState>([]);
  const [valeurDeLaRecherche, setValeurDeLaRecherche] = useState('');

  const tableau = useReactTable({
    data: données,
    columns: colonnes,
    globalFilterFn: (ligne, colonneId, filtreValeur) => {
      return rechercheUnTexteContenuDansUnContenant(filtreValeur, ligne.getValue<T>(colonneId).toString());
    },
    state: {
      globalFilter: valeurDeLaRecherche,
      sorting: tri,
      grouping: regroupement,
      columnVisibility: {
        porteur: false,
      },
    },
    onSortingChange: setTri,
    onGroupingChange: setRegroupement,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  useEffect(() => {
    tableau.setPageSize(50);
  }, [tableau]);

  const changementDeLaRechercheCallback = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setValeurDeLaRecherche(event.target.value);
  }, [setValeurDeLaRecherche]);

  const changementDePageCallback = useCallback((numéroDePage: number) => tableau.setPageIndex(numéroDePage - 1), [tableau]);  

  return (
    <ListeChantiersTableauStyled className='fr-table fr-m-0 fr-p-0'>
      { titre ? 
        <Titre
          baliseHtml="h2"
          className="fr-h6"
        >
          {`${titre} (${tableau.getFilteredRowModel().rows.length})`}
        </Titre>
        : null }
      { afficherLesActionsTableau ?
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
        : null }
      {tableau.getRowModel().rows.length === 0
        ?
          <div className="fr-notice fr-notice--info">
            <div className="fr-container">
              <div className="fr-notice__body">
                <p className="fr-notice__title">
                  {`Aucun ${entité} ne correspond à votre recherche !`}
                </p>
                Vous pouvez modifier vos filtres pour élargir votre recherche.
              </div>
            </div>
          </div>
        :
          <>
            <table className='tableau'>
              <caption className="fr-sr-only">
                {titre}
              </caption>
              <ListeChantiersTableauEnTête<T> tableau={tableau} />
              <ListeChantiersTableauContenu<T> tableau={tableau} />
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
