import React from 'react';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';

export const EtapeDonneeIndicateurACollecter = () => {
  const [optionsExport, setOptionsExport] = useQueryState('optionsExport', parseAsString.withDefault('identifiant').withOptions({
    shallow: true,
  }));


  const [, setEtapeCourante] = useQueryState('etapeCourante', parseAsInteger.withOptions({
    shallow: true,
    history: 'push',
  }));

  const onChangeOptionsExport = (optionExport: string) => {
    const arrOptionsExport = optionsExport.split(',');
    if (arrOptionsExport.includes(optionExport)) {
      arrOptionsExport.splice(arrOptionsExport.indexOf(optionExport), 1);
    } else {
      arrOptionsExport.push(optionExport);
    }

    setOptionsExport(arrOptionsExport.join(','));
  };

  return (
    <div>
      <div className='fr-fieldset__element'>
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
            identifiants de l'indicateur, de la PPG associée et du territoire
          </label>
        </div>
        {/*
        Désactivé avant de rajouter les nouvelles colonnes
        <div className='fr-checkbox-group fr-mt-1w'>
          <input
            checked={optionsExport.split(',').includes('cadrage')}
            className='fr-input'
            id='cadrage'
            name='cadrage'
            onChange={() => onChangeOptionsExport('cadrage')}
            type='checkbox'
          />
          <label
            className='fr-label'
            htmlFor='cadrage'
          >
            cadrage de l'indicateur
          </label>
        </div>
        */}
        <div className='fr-checkbox-group fr-mt-1w'>
          <input
            checked={optionsExport.split(',').includes('gouvernance')}
            className='fr-input'
            id='gouvernance'
            name='gouvernance'
            onChange={() => onChangeOptionsExport('gouvernance')}
            type='checkbox'
          />
          <label
            className='fr-label'
            htmlFor='gouvernance'
          >
            gouvernance de l'indicateur et de la PPG associée
          </label>
        </div>
        {/*
        Désactivé avant de rajouter les nouvelles colonnes
        <div className='fr-checkbox-group fr-mt-1w'>
          <input
            checked={optionsExport.split(',').includes('responsabilite')}
            className='fr-input'
            id='responsabilite'
            name='responsabilite'
            onChange={() => onChangeOptionsExport('responsabilite')}
            type='checkbox'
          />
          <label
            className='fr-label'
            htmlFor='responsabilite'
          >
            responsabilités de l’indicateur et de la PPG associée
          </label>
        </div>
        */}
        {/*
        Désactivé avant de rajouter les nouvelles colonnes
        <div className='fr-checkbox-group fr-mt-1w'>
          <input
            checked={optionsExport.split(',').includes('objectif')}
            className='fr-input'
            id='objectif'
            name='objectif'
            onChange={() => onChangeOptionsExport('objectif')}
            type='checkbox'
          />
          <label
            className='fr-label'
            htmlFor='objectif'
          >
            objectifs de la PPG associée
          </label>
        </div>
        */}
        <div className='fr-checkbox-group fr-mt-1w'>
          <input
            checked={optionsExport.split(',').includes('description')}
            className='fr-input'
            id='description'
            name='description'
            onChange={() => onChangeOptionsExport('description')}
            type='checkbox'
          />
          <label
            className='fr-label'
            htmlFor='description'
          >
            données descriptives de l’indicateur et de la PPG associée sur le territoire
          </label>
        </div>
        {/*
        Désactivé avant de rajouter les nouvelles colonnes
        <div className='fr-checkbox-group fr-mt-1w'>
          <input
            checked={optionsExport.split(',').includes('comparaison')}
            className='fr-input'
            id='comparaison'
            name='comparaison'
            onChange={() => onChangeOptionsExport('comparaison')}
            type='checkbox'
          />
          <label
            className='fr-label'
            htmlFor='comparaison'
          >
            données de comparaison de l’indicateur
          </label>
        </div>
        */}
        <div className='fr-checkbox-group fr-mt-1w'>
          <input
            checked={optionsExport.split(',').includes('synthese')}
            className='fr-input'
            id='synthese'
            name='synthese'
            onChange={() => onChangeOptionsExport('synthese')}
            type='checkbox'
          />
          <label
            className='fr-label'
            htmlFor='synthese'
          >
            météo et synthèse des résultats de la PPG associée sur le territoire
          </label>
        </div>
        {/*
        Désactivé avant de rajouter les nouvelles colonnes
        <div className='fr-checkbox-group fr-mt-1w'>
          <input
            checked={optionsExport.split(',').includes('commentaire')}
            className='fr-input'
            id='commentaire'
            name='commentaire'
            onChange={() => onChangeOptionsExport('commentaire')}
            type='checkbox'
          />
          <label
            className='fr-label'
            htmlFor='commentaire'
          >
            commentaires de la PPG associée
          </label>
        </div>
        */}
        {/*
        Désactivé avant de rajouter les nouvelles colonnes
        <div className='fr-checkbox-group fr-mt-1w'>
          <input
            checked={optionsExport.split(',').includes('decision')}
            className='fr-input'
            id='decision'
            name='decision'
            onChange={() => onChangeOptionsExport('decision')}
            type='checkbox'
          />
          <label
            className='fr-label'
            htmlFor='decision'
          >
            suivi des décisions stratégiques de la PPG associée
          </label>
        </div>
      */}
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
