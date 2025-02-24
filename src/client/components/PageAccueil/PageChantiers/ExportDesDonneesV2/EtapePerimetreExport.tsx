import React from 'react';
import { parseAsBoolean, parseAsInteger, useQueryState } from 'nuqs';

export const EtapePerimetreExport = () => {
  const [isAvecFiltre, setIsAvecFiltre] = useQueryState('isAvecFiltre', parseAsBoolean.withDefault(false).withOptions({
    shallow: true,
  }));

  const [, setEtapeCourante] = useQueryState('etapeCourante', parseAsInteger.withOptions({
    shallow: true,
    history: 'push',
  }));

  return (
    <div>
      <p className='fr-mb-1w'>
        Précisez si vous souhaitez récupérer tous les contenus ou bien la sélection présentement active dans PILOTE :
      </p>
      <div
        className='fr-fieldset__element'
        key='ppg'
      >
        <div className='fr-radio-group'>
          <input
            checked={!isAvecFiltre}
            id='ppg'
            name='ressource-à-exporter'
            onChange={() => setIsAvecFiltre(false)}
            type='radio'
          />
          <label
            className='fr-label'
            htmlFor='ppg'
          >
            exporter tous les contenus sur tous les territoires qui vous sont ouverts en lecture
          </label>
        </div>
      </div>
      <div
        className='fr-fieldset__element'
        key='indicateurs'
      >
        <div className='fr-radio-group'>
          <input
            checked={isAvecFiltre}
            id='indicateurs'
            name='ressource-à-exporter'
            onChange={() => setIsAvecFiltre(true)}
            type='radio'
          />
          <label
            className='fr-label'
            htmlFor='indicateurs'
          >
            exporter les contenus de la sélection présentement active dans PILOTE
          </label>
          <label
            className='fr-label fr-text--xs texte-gris fr-pl-4w'
            htmlFor='indicateurs'
          >
            le cas échéant, le territoire sélectionné et tous les territoires inclus aux mailles inférieures seront
            intégrés dans l’export
          </label>
        </div>
      </div>
      <div className='w-full flex justify-end fr-mt-2w'>
        <button
          className='fr-btn fr-mr-2w'
          onClick={() => setEtapeCourante(1)}
          type='button'
        >
          Étape précédente
        </button>
        <button
          className='fr-btn fr-mr-2w'
          onClick={() => setEtapeCourante(3)}
          type='button'
        >
          Étape suivante
        </button>
      </div>
    </div>
  );
};
