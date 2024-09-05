import { Fragment, useRef } from 'react';
import Titre from '@/client/components/_commons/Titre/Titre';
import SélecteurAvecRechercheStyled from './SélecteurAvecRecherche.styled';
import SélecteurAvecRechercheProps from './SélecteurAvecRecherche.interface';
import useSélecteurAvecRecherche from './useSélecteurAvecRecherche';
import '@gouvfr/dsfr/dist/component/radio/radio.css';
import '@gouvfr/dsfr/dist/component/select/select.min.css';


const SélecteurAvecRecherche = <T extends string>({
  htmlName,
  libellé,
  estVueMobile,
  estVisibleEnMobile,
  options,
  erreurMessage,
  valeurSélectionnée,
  valeurModifiéeCallback,
}: SélecteurAvecRechercheProps<T>) => {
  const ref = useRef(null);
  const {
    estOuvert,
    setEstOuvert,
    SélecteurBoutonProps,
    libelléValeurSélectionnée,
    setRecherche,
    recherche,
    optionsFiltrées,
  } = useSélecteurAvecRecherche(options, valeurSélectionnée);

  return (
    <SélecteurAvecRechercheStyled>
      <div className={`fr-select-group${erreurMessage ? ' fr-select-group--error' : ''}`}>
        {
          estVueMobile && estVisibleEnMobile ? (
            <Titre
              baliseHtml='h3'
              className='fr-h6 fr-my-2w fr-col-8'
            >
              {libellé}
            </Titre>
          ) : libellé ? (
            <label
              className='fr-label'
              htmlFor={htmlName}
            >
              {libellé}
            </label>
          ) : null
        }
        <button
          className={`fr-select${erreurMessage ? ' fr-select--error' : ''} fr-ellipsis`}
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
          <div className='fr-p-2w input-container'>
            <input
              className='fr-input'
              onChange={(e) => setRecherche(e.target.value)}
              placeholder='Rechercher...'
              type='text'
              value={recherche}
            />
          </div>
          {
            optionsFiltrées?.map(option => (
              <Fragment key={`${option.valeur}`}>
                {
                  !option.désactivée ?
                    <div
                      className='fr-option fr-px-2w'
                      id={option.valeur}
                      onClick={(événement) => {
                        setEstOuvert(false);
                        return valeurModifiéeCallback && valeurModifiéeCallback(événement.currentTarget.id as T);
                      }}
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
                      className='fr-px-2w fr-option-disabled'
                      id={option.valeur}
                    >
                      {option.libellé}
                    </div>
                }

              </Fragment>
            ))
          }
        </div>
        {
          (erreurMessage !== undefined) &&
          <p
            className='fr-error-text fr-mt-1v'
          >
            {erreurMessage}
          </p>
        }
      </div>
    </SélecteurAvecRechercheStyled>
  );
};

export default SélecteurAvecRecherche;
