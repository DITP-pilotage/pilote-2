import { useState } from 'react';
import SommaireProps from './Sommaire.interface';
import SommaireStyled from './Sommaire.styled';

export default function Sommaire({ rubriques }: SommaireProps) {
  const [rubriqueCourante, setRubriqueCourante] = useState<SommaireProps['rubriques'][0]['ancre'] | null>(null);

  return (
    <SommaireStyled>
      <nav className='fr-pt-3w fr-pl-7v fr-pr-4w'>
        <p className="bold fr-text--lg fr-mb-1w">
          Sommaire
        </p>
        <ul className="fr-text--sm fr-pl-3w">
          {
            rubriques.map(rubrique => (
              <li
                aria-current={rubriqueCourante === rubrique.ancre}
                className='fr-pb-0'
                key={rubrique.ancre}
              >
                <a
                  href={`#${rubrique.ancre}`}
                  onClick={() => setRubriqueCourante(rubrique.ancre)}
                >
                  {rubrique.nom}
                </a>
                { 
                  !!rubrique.sousRubriques && rubrique.sousRubriques.length > 0 &&
                  <ul className='fr-pl-3w fr-my-0'>
                    {
                      rubrique.sousRubriques.map(sousRubrique => (
                        <li
                          className='fr-pb-0'
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
