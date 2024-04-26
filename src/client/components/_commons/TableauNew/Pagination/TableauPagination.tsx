import '@gouvfr/dsfr/dist/component/pagination/pagination.min.css';
import { parseAsInteger, useQueryStates } from 'nuqs';
import { Table } from '@tanstack/react-table';
import { UtilisateurListeGestion } from '@/server/app/contrats/UtilisateurListeGestion';
import TableauPaginationÉlément from './Élément/TableauPaginationÉlément';

interface TableauPaginationProps {
  nombreDePages: number,
  tableau: Table<UtilisateurListeGestion>
}


export default function TableauPagination({ tableau, nombreDePages }: TableauPaginationProps) {
  const [pagination, setPagination] = useQueryStates({
    pageIndex: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(10),
  }, {
    shallow: false,
    history: 'push',
  });


  if (nombreDePages <= 1) {
    return null;
  }

  const numéroDernièrePage = nombreDePages;
  const numéroPageSuivante = pagination.pageIndex + 1;
  const numéroPagePrécédente = pagination.pageIndex - 1;
  const aLaPremièreTroncature = () => pagination.pageIndex > 3;
  const aLaDeuxièmeTroncature = () => pagination.pageIndex <= numéroDernièrePage - 3;

  return (
    <nav
      aria-label='Pagination'
      className='fr-pagination fr-grid-row fr-grid-row--center fr-mt-11v fr-mb-10w'
      role='navigation'
    >
      <ul className='fr-pagination__list'>
        <li className='fr-unhidden-sm fr-hidden'>
          <button
            className='fr-pagination__link fr-pagination__link--first'
            disabled={pagination.pageIndex === 1}
            onClick={() => setPagination({ pageIndex: 1 })}
            type='button'
          >
            Première page
          </button>
        </li>
        <li className='fr-unhidden-sm fr-hidden'>
          <button
            className='fr-pagination__link fr-pagination__link--prev fr-pagination__link--lg-label'
            disabled={pagination.pageIndex === 1}
            onClick={() => tableau.previousPage()}
            type='button'
          >
            Page précédente
          </button>
        </li>
        {
          nombreDePages <= 5 ?
            [...Array.from({ length: nombreDePages }).keys()].map((page) => (
              <TableauPaginationÉlément
                changementDePageCallback={() => setPagination({ pageIndex: page + 1 })}
                estLaPageCourante={pagination.pageIndex === page + 1}
                key={page}
                numéroDePage={page + 1}
              />
            ))
            :
            <>
              <TableauPaginationÉlément
                changementDePageCallback={() => setPagination({ pageIndex: 1 })}
                estLaPageCourante={pagination.pageIndex === 1}
                numéroDePage={1}
              />
              {
                !aLaPremièreTroncature() &&
                <TableauPaginationÉlément
                  changementDePageCallback={() => setPagination({ pageIndex: 2 })}
                  estLaPageCourante={pagination.pageIndex === 2}
                  numéroDePage={2}
                />
              }
              {
                !aLaPremièreTroncature() && pagination.pageIndex >= 2 &&
                <TableauPaginationÉlément
                  changementDePageCallback={() => setPagination({ pageIndex: 3 })}
                  estLaPageCourante={pagination.pageIndex === 3}
                  numéroDePage={3}
                />
              }
              {
                pagination.pageIndex === 3 &&
                <TableauPaginationÉlément
                  changementDePageCallback={() => setPagination({ pageIndex: 4 })}
                  estLaPageCourante={false}
                  numéroDePage={4}
                />
              }
              {
                aLaPremièreTroncature() &&
                <li className='fr-pagination__link'>
                  ...
                </li>
              }
              {
                aLaPremièreTroncature() && aLaDeuxièmeTroncature() &&
                <>
                  <TableauPaginationÉlément
                    changementDePageCallback={() => setPagination({ pageIndex: numéroPagePrécédente })}
                    estLaPageCourante={false}
                    numéroDePage={numéroPagePrécédente}
                  />
                  <TableauPaginationÉlément
                    changementDePageCallback={() => setPagination({ pageIndex: pagination.pageIndex })}
                    estLaPageCourante
                    numéroDePage={pagination.pageIndex}
                  />
                  <TableauPaginationÉlément
                    changementDePageCallback={() => setPagination({ pageIndex: numéroPageSuivante })}
                    estLaPageCourante={false}
                    numéroDePage={numéroPageSuivante}
                  />
                </>
              }
              {
                aLaDeuxièmeTroncature() &&
                <li className='fr-pagination__link'>
                  ...
                </li>
              }
              {
                pagination.pageIndex === numéroDernièrePage - 2 &&
                <TableauPaginationÉlément
                  changementDePageCallback={() => setPagination({ pageIndex: numéroDernièrePage - 3 })}
                  estLaPageCourante={false}
                  numéroDePage={numéroDernièrePage - 3}
                />
              }
              {
                !aLaDeuxièmeTroncature() && pagination.pageIndex <= numéroDernièrePage - 1 &&
                <TableauPaginationÉlément
                  changementDePageCallback={() => setPagination({ pageIndex: numéroDernièrePage - 2 })}
                  estLaPageCourante={pagination.pageIndex === numéroDernièrePage - 2}
                  numéroDePage={numéroDernièrePage - 2}
                />
              }
              {
                pagination.pageIndex >= numéroDernièrePage - 2 &&
                <TableauPaginationÉlément
                  changementDePageCallback={() => setPagination({ pageIndex: numéroDernièrePage - 1 })}
                  estLaPageCourante={pagination.pageIndex === numéroDernièrePage - 1}
                  numéroDePage={numéroDernièrePage - 1}
                />
              }
              <TableauPaginationÉlément
                changementDePageCallback={() => setPagination({ pageIndex: numéroDernièrePage })}
                estLaPageCourante={pagination.pageIndex === numéroDernièrePage}
                numéroDePage={numéroDernièrePage}
              />
            </>
        }
        <li className='fr-unhidden-sm fr-hidden'>
          <button
            className='fr-pagination__link fr-pagination__link--next fr-pagination__link--lg-label'
            disabled={pagination.pageIndex === numéroDernièrePage}
            onClick={() => tableau.nextPage()}
            type='button'
          >
            Page suivante
          </button>
        </li>
        <li className='fr-unhidden-sm fr-hidden'>
          <button
            className='fr-pagination__link fr-pagination__link--last'
            disabled={pagination.pageIndex === numéroDernièrePage}
            onClick={() => setPagination({ pageIndex: numéroDernièrePage })}
            type='button'
          >
            Dernière page
          </button>
        </li>
      </ul>
    </nav>
  );
}
