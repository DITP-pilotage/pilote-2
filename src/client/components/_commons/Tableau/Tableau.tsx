import '@gouvfr/dsfr/dist/component/table/table.min.css';
import '@gouvfr/dsfr/dist/component/notice/notice.min.css';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import {
  getCoreRowModel, 
  getFilteredRowModel, 
  getPaginationRowModel, 
  getSortedRowModel, 
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import Titre from '@/components/_commons/Titre/Titre';
import BarreDeRecherche from '@/components/_commons/BarreDeRecherche/BarreDeRecherche';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import TableauProps from './Tableau.interface';
import TableauEnTête from './TableauEnTête/TableauEnTête';
import TableauContenu from './TableauContenu/TableauContenu';
import TableauPagination from './TableauPagination/TableauPagination';
import TableauStyled from './Tableau.styled';

export default function Tableau<T extends object>({ colonnes, données, titre, entité, afficherLaRecherche = true }: TableauProps<T>) {
  const [tri, setTri] = useState<SortingState>([]);
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
    },
    onSortingChange: setTri,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
    <TableauStyled className='fr-table fr-mb-0'>
      { titre ? 
        <Titre
          baliseHtml="h2"
          className="fr-h6"
        >
          {`${titre} (${tableau.getFilteredRowModel().rows.length})`}
        </Titre>
        : null }
      { afficherLaRecherche ? 
        <div className='barre-de-recherche fr-my-2w'>
          <BarreDeRecherche
            changementDeLaRechercheCallback={changementDeLaRechercheCallback}
            valeur={valeurDeLaRecherche}
          />
        </div>
        : null }
      {
        tableau.getRowModel().rows.length === 0
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
            <table className='tableau'>
              <caption className="fr-sr-only">
                {titre}
              </caption>
              <TableauEnTête<T> tableau={tableau} />
              <TableauContenu<T> tableau={tableau} />
            </table>
      }
      <TableauPagination
        changementDePageCallback={changementDePageCallback}
        nombreDePages={tableau.getPageCount()}
        numéroDePageInitiale={1}
      />
    </TableauStyled>
  );
}
