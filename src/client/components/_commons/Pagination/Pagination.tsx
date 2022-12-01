import { useState } from 'react';
import PaginationProps from './Pagination.interface';
import '@gouvfr/dsfr/dist/component/pagination/pagination.min.css';
import PaginationÉlément from './PaginationÉlément/PaginationÉlément';

export default function Pagination({ nombreDePages, changementDePageCallback, numéroDePageInitiale }: PaginationProps) {
  const [numéroDePageCourante, setNuméroDePageCourante] = useState(numéroDePageInitiale);

  function changerPage(numéroDePage: number) {
    setNuméroDePageCourante(numéroDePage);
    changementDePageCallback(numéroDePage);
  }

  const numéroDernièrePage = nombreDePages;
  const numéroPageSuivante = numéroDePageCourante + 1;
  const numéroPagePrécédente = numéroDePageCourante - 1;
  const aLaPremièreTroncature = () => numéroDePageCourante > 3;
  const aLaDeuxièmeTroncature = () => numéroDePageCourante <= numéroDernièrePage - 3;
  
  return (
    <nav
      aria-label="Pagination"
      className="fr-pagination"
      role="navigation"
    >
      <ul className="fr-pagination__list">
        <li className='fr-unhidden-sm fr-hidden'>
          <button
            className="fr-pagination__link fr-pagination__link--first"
            disabled={numéroDePageCourante === 1}
            onClick={() => changerPage(1)}
            type="button"
          >
            Première page
          </button>
        </li>
        <li className='fr-unhidden-sm fr-hidden'>
          <button
            className="fr-pagination__link fr-pagination__link--prev fr-pagination__link--lg-label"
            disabled={numéroDePageCourante === 1}
            onClick={() => changerPage(numéroPagePrécédente)}
            type="button"
          >
            Page précédente
          </button>
        </li>
        {
          nombreDePages <= 5 ? 
            [...Array.from({ length: nombreDePages }).keys()].map((page) => (
              <PaginationÉlément
                changementDePageCallback={() => changerPage(page + 1)}
                estLaPageCourante={numéroDePageCourante === page + 1}
                key={page}
                numéroDePage={page + 1}
              />
            ))
            : 
            <>
              <PaginationÉlément
                changementDePageCallback={() => changerPage(1)}
                estLaPageCourante={numéroDePageCourante === 1}
                numéroDePage={1}
              />
              {
                !aLaPremièreTroncature() &&
                  <PaginationÉlément
                    changementDePageCallback={() => changerPage(2)}
                    estLaPageCourante={numéroDePageCourante === 2}
                    numéroDePage={2}
                  />
              }
              {
                !aLaPremièreTroncature() && numéroDePageCourante >= 2 &&
                <PaginationÉlément
                  changementDePageCallback={() => changerPage(3)}
                  estLaPageCourante={numéroDePageCourante === 3}
                  numéroDePage={3}
                />
              }
              {
                numéroDePageCourante === 3 &&
                <PaginationÉlément
                  changementDePageCallback={() => changerPage(4)}
                  estLaPageCourante={false}
                  numéroDePage={4}
                />
              }
              {
                aLaPremièreTroncature() &&
                <li className="fr-pagination__link">
                  ...
                </li>
              }
              {
                aLaPremièreTroncature() && aLaDeuxièmeTroncature() &&
                <>
                  <PaginationÉlément
                    changementDePageCallback={() => changerPage(numéroPagePrécédente)}
                    estLaPageCourante={false}
                    numéroDePage={numéroPagePrécédente}
                  />
                  <PaginationÉlément
                    changementDePageCallback={() => changerPage(numéroDePageCourante)}
                    estLaPageCourante
                    numéroDePage={numéroDePageCourante}
                  />
                  <PaginationÉlément
                    changementDePageCallback={() => changerPage(numéroPageSuivante)}
                    estLaPageCourante={false}
                    numéroDePage={numéroPageSuivante}
                  />
                </>
              }
              {
                aLaDeuxièmeTroncature() &&
                <li className="fr-pagination__link">
                  ...
                </li>
              }
              {
                numéroDePageCourante === numéroDernièrePage - 2 &&
                <PaginationÉlément
                  changementDePageCallback={() => changerPage(numéroDernièrePage - 3)}
                  estLaPageCourante={false}
                  numéroDePage={numéroDernièrePage - 3}
                />
              }
              {
                !aLaDeuxièmeTroncature() && numéroDePageCourante <= numéroDernièrePage - 1 &&
                <PaginationÉlément
                  changementDePageCallback={() => changerPage(numéroDernièrePage - 2)}
                  estLaPageCourante={numéroDePageCourante === numéroDernièrePage - 2}
                  numéroDePage={numéroDernièrePage - 2}
                />
              }
              {
                numéroDePageCourante >= numéroDernièrePage - 2 &&
                <PaginationÉlément
                  changementDePageCallback={() => changerPage(numéroDernièrePage - 1)}
                  estLaPageCourante={numéroDePageCourante === numéroDernièrePage - 1}
                  numéroDePage={numéroDernièrePage - 1}
                />
              }
              <PaginationÉlément
                changementDePageCallback={() => changerPage(numéroDernièrePage)}
                estLaPageCourante={numéroDePageCourante === numéroDernièrePage}
                numéroDePage={numéroDernièrePage}
              />
            </>
          }
        <li className='fr-unhidden-sm fr-hidden'>
          <button
            className="fr-pagination__link fr-pagination__link--next fr-pagination__link--lg-label"
            disabled={numéroDePageCourante === numéroDernièrePage}
            onClick={() => changerPage(numéroPageSuivante)}
            type="button"
          >
            Page suivante
          </button>
        </li>
        <li className='fr-unhidden-sm fr-hidden'>
          <button
            className="fr-pagination__link fr-pagination__link--last"
            disabled={numéroDePageCourante === numéroDernièrePage}
            onClick={() => changerPage(numéroDernièrePage)}
            type="button"
          >
            Dernière page
          </button>
        </li>
      </ul>
    </nav>
  );
}