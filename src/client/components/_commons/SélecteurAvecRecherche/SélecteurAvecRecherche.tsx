import { Fragment, useRef } from 'react';
import SélecteurAvecRechercheStyled from './SélecteurAvecRecherche.styled';
import SélecteurAvecRechercheProps from './SélecteurAvecRecherche.interface';
import useSélecteurAvecRecherche from './useSélecteurAvecRecherche';
import '@gouvfr/dsfr/dist/component/radio/radio.css';
import '@gouvfr/dsfr/dist/component/select/select.min.css';


export default function SélecteurAvecRecherche<T extends string>({ htmlName, libellé, options, valeurSélectionnée, valeurModifiéeCallback } : SélecteurAvecRechercheProps<T>) {
  const ref = useRef(null);
  const {
    estOuvert,
    SélecteurBoutonProps,
    libelléValeurSélectionnée,
    setRecherche,
    recherche,
    optionsFiltrées,
  } = useSélecteurAvecRecherche(options, valeurSélectionnée);

  return (
    <SélecteurAvecRechercheStyled>
      <label
        className='fr-label'
        htmlFor={htmlName}
      >
        {libellé}
      </label> 
      <button
        className='fr-select fr-ellipsis'
        id={htmlName}
        title={libellé}
        type='button'
        {...SélecteurBoutonProps}
      >
        {libelléValeurSélectionnée}
      </button>
      <div
        className={estOuvert ? 'visible' : ''}
        ref={ref}
        role='menu'
      >
        <input
          className='fr-input fr-mb-2w'
          onChange={(e) => setRecherche(e.target.value)}
          placeholder='Rechercher...'
          type='text'
          value={recherche}
        />
        {
          optionsFiltrées?.map(option => (
            <Fragment key={`${option.valeur}`}>
              {
                !!!option.désactivée ?
                  <div 
                    className='fr-option'
                    id={option.valeur}
                    onClick={(événement) => valeurModifiéeCallback && valeurModifiéeCallback(événement.currentTarget.id as T)}
                    onKeyDown={(événement) => {
                      if ((événement.key === 'Enter' || événement.key === ' ') && !!valeurModifiéeCallback) {
                        valeurModifiéeCallback(événement.currentTarget.id as T);
                      }
                    }}
                    role='button'
                    tabIndex={0}
                  >
                    {option.libellé}
                  </div>
                  :
                  <div 
                    className='fr-option-disabled'
                    id={option.valeur}
                  >
                    {option.libellé}
                  </div>                  
                }

            </Fragment>
          ))
        }
      </div>
    </SélecteurAvecRechercheStyled>
  );
}
