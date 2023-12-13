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
              <div className='fr-fieldset__element'>
                <div className='fr-radio-group'>
                  <input
                    checked={valeurSélectionnée === option.valeur}
                    className='fr-input'
                    disabled={option.désactivée}
                    id={option.valeur}
                    name={option.valeur}
                    onChange={(événement) => valeurModifiéeCallback && valeurModifiéeCallback(événement.currentTarget.name as T)}
                    type='radio'
                  />
                  <label
                    className='fr-label'
                    htmlFor={option.valeur}
                  >
                    {option.libellé}
                  </label>
                </div>
              </div>
            </Fragment>
          ))
        }
      </div>
    </SélecteurAvecRechercheStyled>
  );
}
