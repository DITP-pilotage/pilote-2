import { Fragment, useRef } from 'react';
import SélecteurCustomStyled from './SélecteurCustom.styled';
import SélecteurCustomProps from './SélecteurCustom.interface';
import useSélecteurCustom from './useSélecteurCustom';
import '@gouvfr/dsfr/dist/component/radio/radio.css';
import '@gouvfr/dsfr/dist/component/select/select.min.css';


export default function SélecteurCustom<T extends string>({
  htmlName,
  options,
  valeurSélectionnée,
  valeurModifiéeCallback,
}: SélecteurCustomProps<T>) {
  const ref = useRef(null);
  const {
    estOuvert,
    setEstOuvert,
    SélecteurBoutonProps,
    libelléValeurSélectionnée,
  } = useSélecteurCustom(options, valeurSélectionnée);

  return (
    <SélecteurCustomStyled>
      <button
        className='fr-select fr-ellipsis'
        id={htmlName}
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
        {
          options?.map(option => (
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
    </SélecteurCustomStyled>
  );
}
