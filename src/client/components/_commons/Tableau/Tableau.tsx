import '@gouvfr/dsfr/dist/component/table/table.min.css';
import '@gouvfr/dsfr/dist/component/notice/notice.min.css';
import { useCallback, useEffect, useState } from 'react';
import { getCoreRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import TableauProps from './Tableau.interface';
import TableauEnTête from './EnTête/TableauEnTête';
import TableauContenu from './Contenu/TableauContenu';
import TableauPagination from './Pagination/TableauPagination';
import TableauStyled from './Tableau.styled';

export default function Tableau<T extends object>({ colonnes, données, titre }: TableauProps<T>) {
  const [tri, setTri] = useState<SortingState>([]);

  const tableau = useReactTable({
    data: données,
    columns: colonnes,
    state: {
      sorting: tri,
    },
    onSortingChange: setTri,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  useEffect(() => {
    tableau.setPageSize(50);
  }, [tableau]);

  const changementDePageCallback = useCallback((numéroDePage: number) => tableau.setPageIndex(numéroDePage - 1), [tableau]);  

  return (
    <TableauStyled className='fr-table fr-m-0 fr-p-0'>
      {tableau.getRowModel().rows.length === 0
        ?
          <div className="fr-notice fr-notice--info">
            <div className="fr-container">
              <div className="fr-notice__body">
                <p className="fr-notice__title">
                  Aucun élément à afficher
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
              <TableauEnTête<T> tableau={tableau} />
              <TableauContenu<T> tableau={tableau} />
            </table>
            <TableauPagination
              changementDePageCallback={changementDePageCallback}
              nombreDePages={tableau.getPageCount()}
              numéroDePageInitiale={1}
            />
          </>}
    </TableauStyled>
  );
}
