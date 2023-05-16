import { useState } from 'react';
import SommaireProps from './Sommaire.interface';
import SommaireStyled from './Sommaire.styled';

export default function Sommaire({ rubriques }: SommaireProps) {
  const [rubriqueCourante, setRubriqueCourante] = useState<SommaireProps['rubriques'][0]['ancre'] | null>(null);

  return (
    <SommaireStyled className='fr-hidden fr-unhidden-lg'>
      <nav className='fr-pt-3w fr-pl-7v fr-pr-4w'>
        <p className="bold fr-text--lg fr-mb-1w">
          Sommaire
        </p>
        <ul className="fr-text--sm fr-pl-3w">
          {
            rubriques.map(rubrique => (
              <li
                aria-current={rubriqueCourante === rubrique.ancre}
                className='fr-pb-1w'
                key={rubrique.ancre}
              >
                <a
                  href={`#${rubrique.ancre}`}
                  onClick={() => setRubriqueCourante(rubrique.ancre)}
                >
                  {rubrique.nom}
                </a>
                { 
                  !!rubrique.sousRubriques &&
                  <ul className='fr-pl-3w'>
                    {
                      rubrique.sousRubriques.map(sousRubrique => (
                        <li
                          className='fr-pb-1w'
                          key={sousRubrique.nom}
                        >
                          <a href={`#${sousRubrique.ancre}`}>
                            {sousRubrique.nom}
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
    </SommaireStyled>
  );
}
