import React from 'react';
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';

export const EtapeContenuAExporter = () => {
  const [typeExport, setTypeExport] = useQueryState('typeExport', parseAsStringLiteral(['ppg', 'indicateurs']).withDefault('ppg').withOptions({
    shallow: true,
  }));
  const [, setOptionsExport] = useQueryState('optionsExport', parseAsString.withDefault('identifiant').withOptions({
    shallow: true,
  }));

  const [, setEtapeCourante] = useQueryState('etapeCourante', parseAsInteger.withOptions({
    shallow: true,
    history: 'push',
  }));

  const modifierTypeExport = (typeExportADefinir: 'ppg' | 'indicateurs') => {
    setOptionsExport('identifiant');
    setTypeExport(typeExportADefinir);
  };

  return (
    <div>
      <div
        className='fr-fieldset__element'
        key='ppg'
      >
        <div className='fr-radio-group'>
          <input
            checked={typeExport === 'ppg'}
            id='ppg'
            name='ressource-à-exporter'
            onChange={() => modifierTypeExport('ppg')}
            type='radio'
          />
          <label
            className='fr-label'
            htmlFor='ppg'
          >
            Les PPG
          </label>
        </div>
      </div>
      <div
        className='fr-fieldset__element'
        key='indicateurs'
      >
        <div className='fr-radio-group'>
          <input
            checked={typeExport === 'indicateurs'}
            id='indicateurs'
            name='ressource-à-exporter'
            onChange={() => modifierTypeExport('indicateurs')}
            type='radio'
          />
          <label
            className='fr-label'
            htmlFor='indicateurs'
          >
            Les indicateurs des PPG
          </label>
        </div>
      </div>
      <div className='w-full flex justify-end fr-mt-2w'>
        <button
          className='fr-btn fr-mr-2w'
          onClick={() => setEtapeCourante(2)}
          type='button'
        >
          Étape suivante
        </button>
      </div>
    </div>
  );
};
