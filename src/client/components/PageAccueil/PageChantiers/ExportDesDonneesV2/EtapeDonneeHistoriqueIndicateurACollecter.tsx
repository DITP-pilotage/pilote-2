import React from 'react';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';

export const EtapeDonneeHistoriqueIndicateurACollecter = () => {
  const [optionsExport] = useQueryState('optionsExport', parseAsString.withDefault('identifiant,valeur-cible,valeur-actuelle').withOptions({
    shallow: true,
  }));

  const [, setEtapeCourante] = useQueryState('etapeCourante', parseAsInteger.withOptions({
    shallow: true,
    history: 'push',
  }));

  return (
    <div>
      <p className='fr-mt-2w fr-mb-0'>
        Vous avez choisi d'exporter
        {' '}
        <strong>
          l'historique des indicateurs.
        </strong>
      </p>
      <p className='fr-mt-1w fr-mb-0'>
        Pour chacun des indicateurs et des territoires inclus dans le périmètre d'export, les données collectées sont
        les suivantes :
      </p>
      <div className='fr-fieldset__element fr-pl-0 fr-pb-2w'>
        <h3 className='fr-text--md underline fr-mb-1w'>
          DÉFINITION
        </h3>
        <div className='fr-checkbox-group'>
          <input
            checked={optionsExport.split(',').includes('identifiant')}
            className='fr-input'
            disabled
            id='identifiant'
            name='identifiant'
            type='checkbox'
          />
          <label
            className='fr-label'
            htmlFor='identifiant'
          >
            <span>
              <span className='fr-text--bold'>
                identifiants
              </span>
              {' '}
              de l'indicateur et du territoire
            </span>
          </label>
        </div>
        <div className='fr-checkbox-group fr-mt-1w'>
          <input
            checked={optionsExport.split(',').includes('valeur-cible')}
            className='fr-input'
            disabled
            id='valeur-cible'
            name='valeur-cible'
            type='checkbox'
          />
          <label
            className='fr-label'
            htmlFor='valeur-cible'
          >
            <span>
              <span className='fr-text--bold'>
                valeur initiale
              </span>
              {' '}
              et
              {' '}
              <span className='fr-text--bold'>
                valeurs cibles
              </span>
              {' '}
              de l'indicateur sur le territoire les valeurs cibles sont exportées pour l'année en cours et pour l'année
              2026
            </span>
          </label>
          <span
            className='fr-label fr-text--xs texte-gris fr-mb-0 fr-ml-4w'
          >
            les valeurs cibles sont exportées pour l'année en cours et pour l'année 2026
          </span>
        </div>
        <div className='fr-checkbox-group fr-mt-1w'>
          <input
            checked={optionsExport.split(',').includes('valeur-actuelle')}
            className='fr-input'
            disabled
            id='valeur-actuelle'
            name='valeur-actuelle'
            type='checkbox'
          />
          <label
            className='fr-label'
            htmlFor='valeur-actuelle'
          >
            <span>
              <span className='fr-text--bold'>
                valeurs actuelles
              </span>
              {' '}
              de l'indicateur sur le territoire, mois par mois
            </span>
          </label>
        </div>
      </div>
      <div className='w-full flex justify-end fr-mt-2w'>
        <button
          className='fr-btn fr-mr-2w'
          onClick={() => setEtapeCourante(2)}
          type='button'
        >
          Étape précédente
        </button>
        <button
          className='fr-btn fr-mr-2w'
          onClick={() => setEtapeCourante(4)}
          type='button'
        >
          Étape suivante
        </button>
      </div>
    </div>
  );
};
