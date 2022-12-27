/* Linter désactivé car il ne gère pas les accents sur le E majuscule */
/* eslint-disable react/hook-use-state */
import { useEffect, useRef, useState } from 'react';
import { Éléments } from './Sommaire.interface';
import styles from './Sommaire.module.scss';
import SommaireBoutonDéplier from './SommaireBoutonDéplier/SommaireBoutonDéplier';

const listeDesÉlémentsSommaireÀPartirDesÉlémentsHTML = (titres: Element[]) => {
  const listeÉlémentsTemporaire: Éléments = [];
  titres.forEach(titre => {
    if (titre.nodeName === 'H2') 
      listeÉlémentsTemporaire.push({ nom: titre.textContent, ancre: titre.id, sousÉléments: [] });
    else if (titre.nodeName === 'H3' && titres.length > 0) 
      listeÉlémentsTemporaire[listeÉlémentsTemporaire.length - 1].sousÉléments.push({ nom: titre.textContent, ancre: titre.id });
  });
  return listeÉlémentsTemporaire;
};

export default function Sommaire() {
  const [éléments, setÉléments] = useState<Éléments>([]);
  const [élémentCourant, setÉlémentCourant] = useState<Éléments[number]['ancre'] | null>(null);
  const [élémentDéplié, setÉlémentDéplié] = useState<Éléments[number]['ancre'] | null>('indicateurs');

  const clicSurLeBoutonDéplierCallback = (ancre: Éléments[number]['ancre']) => {
    if (élémentDéplié === ancre)
      setÉlémentDéplié(null);
    else
      setÉlémentDéplié(ancre);
  };
  
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const titres = [...document.querySelectorAll('h2, h3')];
    setÉléments(listeDesÉlémentsSommaireÀPartirDesÉlémentsHTML(titres));
    
    observer.current = new IntersectionObserver((entrées) => {
      entrées.forEach(entrée => {
        if (entrée?.isIntersecting) {
          setÉlémentCourant(entrée.target.id);
        }
      });
    }, { rootMargin: '-200px 0px -40% 0px' });
    
    titres.forEach(titre => observer.current?.observe(titre));
    return () => observer.current?.disconnect();
  }, []);

  return (
    <div className={`${styles.conteneur} fr-hidden fr-unhidden-lg`}>
      <nav className='fr-pt-3w fr-pl-7v fr-pr-8w'>
        <p className="bold fr-text--lg fr-mb-1w">
          Sommaire
        </p>
        <ul className="fr-text--sm fr-pl-3w">
          { éléments.map(élément => (
            <li
              aria-current={élémentCourant === élément.ancre}
              className='fr-pb-1w'
              key={élément.ancre}
            >
              { élément.sousÉléments.length > 0 && 
              <SommaireBoutonDéplier
                clicSurLeBoutonDéplierCallback={() => clicSurLeBoutonDéplierCallback(élément.ancre)}
                estDéplié={élément.ancre === élémentDéplié}
              /> }
              <a
                href={`#${élément.ancre}`}
                onClick={() => setÉlémentCourant(élément.ancre)}
              >
                {élément.nom}
              </a>
              { (élémentDéplié === élément.ancre && élément.sousÉléments.length > 0) &&
              <ul className='fr-pl-3w'>
                { élément.sousÉléments.map(sousÉlément => (
                  <li
                    aria-current={élémentCourant === sousÉlément.ancre}
                    className='fr-pb-1w'
                    key={sousÉlément.nom}
                  >
                    <a
                      href={`#${sousÉlément.ancre}`}
                      onClick={() => setÉlémentCourant(sousÉlément.ancre)}
                    >
                      {sousÉlément.nom}
                    </a>
                  </li>
                )) }
              </ul>}
            </li>
          )) }
        </ul>
      </nav>
    </div>
  );
}
