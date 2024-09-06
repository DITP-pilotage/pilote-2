import { FunctionComponent } from 'react';
import { Rubrique } from '@/client/utils/rubriques';
import SommaireStyled from './Sommaire.styled';

interface SommaireProps {
  rubriques: Rubrique[];
  auClic?: () => void;
}

const Sommaire: FunctionComponent<SommaireProps> = ({ rubriques, auClic }) => {
  return (
    <SommaireStyled>
      <nav className='fr-pt-3w fr-pl-7v fr-pr-4w'>
        <p className='bold fr-text--lg fr-mb-1w'>
          Sommaire
        </p>
        <ul className='fr-text--sm fr-pl-3w'>
          {
            rubriques.map(rubrique => (
              <li
                className='fr-pb-0'
                key={rubrique.ancre}
              >
                <a
                  href={`#${rubrique.ancre}`}
                  onClick={auClic}
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
                          <a
                            href={`#${sousRubrique.ancre}`}
                            onClick={auClic}
                          >
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
};

export default Sommaire;
