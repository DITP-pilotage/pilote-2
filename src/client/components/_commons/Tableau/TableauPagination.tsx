import { useCallback } from 'react';
import TableauPaginationrProps from './TableauPagination.interface';
import '@gouvfr/dsfr/dist/component/pagination/pagination.min.css';

function afficherListeDesPages(
  numéroDePageCourante: number,
  nombreDePagesTotal: number,
  onPageChange: (numeroPage: number) => void,
) {
  let listePages = [];
  for (let i = 1; i <= nombreDePagesTotal; i++) {
    listePages.push(
      <button
        aria-current={numéroDePageCourante === i ? 'page' : undefined}
        className="fr-pagination__link"
        key={`page-${i}`}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={() => onPageChange(i)}
        role="link"
        type="button"
      >
        {i}
      </button>,
    );
  }
  return listePages;
}

export default function TableauPagination<T>({ tableau }: TableauPaginationrProps<T>) {

  const onPreviousPage = useCallback(() => tableau.previousPage(), [tableau]);
  const onNextPage = useCallback(() => tableau.nextPage(), [tableau]);

  return (
    <nav
      aria-label="Pagination"
      className="fr-pagination"
    >
      <ul className="fr-pagination__list">
        <li>
          <button
            className="fr-pagination__link fr-pagination__link--prev fr-pagination__link--lg-label"
            disabled={!tableau.getCanPreviousPage()}
            onClick={onPreviousPage}
            type="button"
          >
            Page précédente
          </button>
        </li>
        {
          afficherListeDesPages(
            tableau.getState().pagination.pageIndex + 1,
            tableau.getPageCount(),
            (numeroPage) => { tableau.setPageIndex(numeroPage - 1); },
          )
        }
        <li>
          <button
            className="fr-pagination__link fr-pagination__link--next fr-pagination__link--lg-label"
            disabled={!tableau.getCanNextPage()}
            onClick={onNextPage}
            type="button"
          >
            Page suivante
          </button>
        </li>
      </ul>
    </nav>
  );
}