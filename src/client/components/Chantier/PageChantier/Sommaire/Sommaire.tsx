/* Linter désactivé car il ne gère pas les accents sur le E majuscule */
/* eslint-disable react/hook-use-state */
import { useState } from 'react';
import SommaireProps from './Sommaire.interface';
import styles from './Sommaire.module.scss';
import SommaireBoutonDéplier from './SommaireBoutonDéplier/SommaireBoutonDéplier';

export default function Sommaire({ indicateurs }: SommaireProps) {
  const [élémentCourant, setÉlémentCourant] = useState<SommaireProps['indicateurs'][0]['ancre'] | null>(null);
  const [élémentDéplié, setÉlémentDéplié] = useState<SommaireProps['indicateurs'][0]['ancre'] | null>('indicateurs');

  const éléments = [
    { nom: 'Avancement', ancre: 'avancement' },
    { nom: 'Synthèse des résultats', ancre: 'synthèse' },
    { nom: 'Responsables', ancre: 'responsables' },
    { nom: 'Cartes', ancre: 'cartes' },
    { nom: 'Indicateurs', ancre: 'indicateurs', sousÉlément: indicateurs },
    { nom: 'Commentaires', ancre: 'commentaires' },
  ];

  const clicSurLeBoutonDéplierCallback = (ancre: SommaireProps['indicateurs'][0]['ancre']) => {
    if (élémentDéplié === ancre)
      setÉlémentDéplié(null);
    else
      setÉlémentDéplié(ancre);
  };

  return (
    <div className={`${styles.conteneur} fr-hidden fr-unhidden-lg`}>
      <nav className='fr-pt-3w fr-pl-7v fr-pr-8w'>
        <p className="bold fr-text--lg fr-mb-1w">
          Sommaire
        </p>
        <ul className="fr-text--sm fr-pl-3w">
          {
            éléments.map(élément => (
              <li
                aria-current={élémentCourant === élément.ancre}
                className='fr-pb-1w'
                key={élément.ancre}
              >
                { 
                  !!élément.sousÉlément && 
                  <SommaireBoutonDéplier
                    clicSurLeBoutonDéplierCallback={() => clicSurLeBoutonDéplierCallback(élément.ancre)}
                    estDéplié={élément.ancre === élémentDéplié}
                  />
                }
                <a
                  href={`#${élément.ancre}`}
                  onClick={() => setÉlémentCourant(élément.ancre)}
                >
                  {élément.nom}
                </a>
                { 
                  (élémentDéplié === élément.ancre && !!élément.sousÉlément) &&
                  <ul className='fr-pl-3w'>
                    {
                      élément.sousÉlément.map(sousÉlément => (
                        <li
                          className='fr-pb-1w'
                          key={sousÉlément.nom}
                        >
                          <a href={`#${sousÉlément.ancre}`}>
                            {sousÉlément.nom}
                          </a>
                        </li>
                      )) 
                    }
                  </ul>
                }
              </li>
            ))
          }
        </ul>
      </nav>
    </div>
  );
}
