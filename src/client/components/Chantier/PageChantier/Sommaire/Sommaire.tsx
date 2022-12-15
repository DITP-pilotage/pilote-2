import { useState } from 'react';
import SommaireProps from './Sommaire.interface';
import styles from './Sommaire.module.scss';

export default function Sommaire({ éléments }: SommaireProps) {
  const [estOuvert, setEstOuvert] = useState(false);

  return (
    <div className={`${styles.conteneur} fr-hidden fr-unhidden-md`}>
      <nav className='fr-p-3w'>
        <p className="fr-text--lg">
          Sommaire
        </p>
        <ul className="fr-text--sm">
          {éléments.map(élément => (
            <li
              className='fr-pb-1w'
              key={élément.nom}
            >
              { élément.sousÉlément ? 
                <button
                  className='fr-ml-n4w'
                  onClick={() => setEstOuvert(!estOuvert)}
                  type='button'
                >
                  <span
                    aria-hidden="true"
                    className={`${estOuvert ? 'ouvert' : ''} fr-icon-arrow-right-s-line`}
                  />
                </button>
                : null }
              <a href={élément.ancre}>
                {élément.nom}
              </a>
              { élément.sousÉlément 
                ?
                  <ul className={estOuvert ? 'fr-ml-2w' : 'fr-hidden'}>
                    {élément.sousÉlément.map(sousÉlément => (
                      <li
                        className='fr-pb-1w'
                        key={sousÉlément.nom}
                      >
                        <a href={sousÉlément.ancre}>
                          {sousÉlément.nom}
                        </a>
                      </li>
                    )) }
                  </ul>
                : null }
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
