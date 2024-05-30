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
              <h2 className='fr-h3'>
                Aucune nouveautés sur le projet
              </h2>
            ) : (
              <>
                <div className='fr-grid-row'>
                  <div className='fr-col-12'>
                    <h2 className='fr-h3'>
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
                    <h3 className='fr-h6'>
                      Nouvelles fonctionnalités
                    </h3>
                    <div className='fr-mb-2w'>
                      <ul>
                        {
                          ParametrageNouveautés[0].contenu.map((elementContenu, indexContenu) => (
                            <li
                              className='fr-m-0'
                              key={`element-contenu-${ParametrageNouveautés[0].version}-${indexContenu}`}
                            >
                              {elementContenu}
                            </li>
                          ))
                        }
                      </ul>
                    </div>
                    {
                      ParametrageNouveautés[0].correctifs.length > 0 ? (
                        <>
                          <h3 className='fr-h6'>
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
                        </>
                      ) : null
                    }
                  </div>
                </div>
                {
                  ParametrageNouveautés.slice(1, ParametrageNouveautés.length).map((element, index) => {
                    return (
                      <div
                        className='fr-grid-row fr-mb-2w fr-mt-2w'
                        key={`nouveauté-${element.date}`}
                      >
                        <div className='fr-col-12'>
                          <h2 className='fr-h3'>
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
                          <section className='fr-accordion'>
                            <h3 className='fr-accordion__title'>
                              <button
                                aria-controls={`accordion-${index}`}
                                aria-expanded='false'
                                className='fr-accordion__btn'
                                type='button'
                              >
                                Voir le détail
                              </button>
                            </h3>
                            <div
                              className='fr-collapse'
                              id={`accordion-${index}`}
                            >
                              <h3 className='fr-h6'>
                                Nouvelles fonctionnalités
                              </h3>
                              <ul className='fr-mb-2w'>
                                {
                                  element.contenu.map((elementContenu, indexContenu) => (
                                    <li
                                      className='fr-m-0'
                                      key={`element-contenu-${element.version}-${indexContenu}`}
                                    >
                                      {elementContenu}
                                    </li>
                                  ))
                                }
                              </ul>
                              {
                                element.correctifs.length > 0 ? (
                                  <>
                                    <h3 className='fr-h6'>
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
                                  </>
                                ) : null
                              }
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
