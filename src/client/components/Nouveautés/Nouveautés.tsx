import Link from 'next/link';
import { FunctionComponent } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import '@gouvfr/dsfr/dist/component/accordion/accordion.min.css';
import { ParametrageNouveautés } from '../../../../public/nouveautés/ParametrageNouveautés';

const Nouveautés: FunctionComponent<{}> = () => {
  return (
    <main>
      <div className='fr-container fr-pb-2w'>
        <div className='fr-grid-row fr-py-4w'>
          <Titre
            baliseHtml='h1'
            className='fr-my-auto'
          >
            Nouveautés
          </Titre>
        </div>
        <Bloc>
          {
            !ParametrageNouveautés || ParametrageNouveautés.length === 0 ? (
              <h2 className='fr-h4'>
                Aucune nouveautés sur le projet
              </h2>
            ) : (
              <>
                <div className='fr-grid-row'>
                  <div className='fr-col-12'>
                    <h2 className='fr-h4'>
                      {`${ParametrageNouveautés[0].version} du ${ParametrageNouveautés[0].date}`}
                      {ParametrageNouveautés[0].lienCentreAide ? (
                        <Link
                          className='fr-link fr-ml-2w'
                          href={ParametrageNouveautés[0].lienCentreAide}
                          rel='noopener external'
                          target='_blank'
                        >
                          Lien vers le centre d'aide
                        </Link>
                      ) : null}
                    </h2>
                    <h3 className='fr-h5'>
                      Nouvelles fonctionnalités
                    </h3>
                    <p>
                      {ParametrageNouveautés[0].contenu}
                    </p>
                    <h3 className='fr-h5'>
                      Correctifs
                    </h3>
                    <ul>
                      {
                        ParametrageNouveautés[0].correctifs.map((elementCorrectif, indexCorrectif) => {
                          return (
                            <li key={`correctif-0-${indexCorrectif}`}>
                              {elementCorrectif}
                            </li>
                          );
                        },
                        )
                      }
                    </ul>
                  </div>
                </div>
                {
                  ParametrageNouveautés.slice(1, ParametrageNouveautés.length).map((element, index) => {
                    return (
                      <div
                        className='fr-grid-row fr-mt-2w fr-mb-4w'
                        key={`nouveauté-${element.date}`}
                      >
                        <div className='fr-col-12'>
                          <h2 className='fr-h4'>
                            {`${element.version} du ${element.date}`}
                            {element.lienCentreAide ? (
                              <Link
                                className='fr-link fr-ml-2w'
                                href={element.lienCentreAide}
                                rel='noopener external'
                                target='_blank'
                              >
                                Lien vers le centre d'aide
                              </Link>
                            ) : null}
                          </h2>
                          <h3 className='fr-h5'>
                            Nouvelles fonctionnalités
                          </h3>
                          <p>
                            {element.contenu}
                          </p>
                          <section className='fr-accordion'>
                            <h3 className='fr-accordion__title'>
                              <button
                                aria-controls={`accordion-${index}`}
                                aria-expanded='false'
                                className='fr-accordion__btn'
                                type='button'
                              >
                                Voir plus
                              </button>
                            </h3>
                            <div
                              className='fr-collapse'
                              id={`accordion-${index}`}
                            >
                              <h3 className='fr-h5'>
                                Correctifs
                              </h3>
                              <ul>
                                {
                                  element.correctifs.map((elementCorrectif, indexCorrectif) => {
                                    return (
                                      <li key={`correctif-${index}-${indexCorrectif}`}>
                                        {elementCorrectif}
                                      </li>
                                    );
                                  },
                                  )
                                }
                              </ul>
                            </div>
                          </section>
                        </div>
                      </div>
                    );
                  })
                }
              </>
            )
          }
        </Bloc>
      </div>
    </main>
  );
};

export default Nouveautés;
