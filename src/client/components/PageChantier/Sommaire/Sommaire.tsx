import { useState } from 'react';
import SommaireProps from './Sommaire.interface';
import SommaireStyled from './Sommaire.styled';
import SommaireBoutonDéplier from './SommaireBoutonDéplier/SommaireBoutonDéplier';

export default function Sommaire({ rubriques }: SommaireProps) {
  const [rubriqueCourante, setRubriqueCourante] = useState<SommaireProps['rubriques'][0]['ancre'] | null>(null);
  const [rubriqueDépliée, setRubriqueDépliée] = useState<SommaireProps['rubriques'][0]['ancre'] | null>(null);

  const clicSurLeBoutonDéplierCallback = (ancre: SommaireProps['rubriques'][0]['ancre']) => {
    if (rubriqueDépliée === ancre)
      setRubriqueDépliée(null);
    else
      setRubriqueDépliée(ancre);
  };

  return (
    <SommaireStyled className='fr-hidden fr-unhidden-lg'>
      <nav className='fr-pt-3w fr-pl-7v fr-pr-8w'>
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
                { 
                  !!rubrique.sousRubriques && (
                    <SommaireBoutonDéplier
                      clicSurLeBoutonDéplierCallback={() => clicSurLeBoutonDéplierCallback(rubrique.ancre)}
                      estDéplié={rubrique.ancre === rubriqueDépliée}
                    />
                  )
                }
                <a
                  href={`#${rubrique.ancre}`}
                  onClick={() => setRubriqueCourante(rubrique.ancre)}
                >
                  {rubrique.nom}
                </a>
                { 
                  (rubriqueDépliée === rubrique.ancre && !!rubrique.sousRubriques) &&
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
