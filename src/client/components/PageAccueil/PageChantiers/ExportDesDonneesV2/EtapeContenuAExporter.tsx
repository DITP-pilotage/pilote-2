import React from 'react';
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';
import { MiseEnAvant } from '@/components/_commons/MiseEnAvant/MiseEnAvant';

export const EtapeContenuAExporter = () => {
  const [typeExport, setTypeExport] = useQueryState('typeExport', parseAsStringLiteral(['ppg', 'indicateurs', 'historique-indicateurs']).withDefault('ppg').withOptions({
    shallow: true,
  }));
  const [, setOptionsExport] = useQueryState('optionsExport', parseAsString.withDefault('identifiant').withOptions({
    shallow: true,
  }));

  const [, setEtapeCourante] = useQueryState('etapeCourante', parseAsInteger.withOptions({
    shallow: true,
    history: 'push',
  }));

  const modifierTypeExport = (typeExportADefinir: 'ppg' | 'indicateurs' | 'historique-indicateurs') => {
    if (typeExportADefinir === 'ppg' || typeExportADefinir === 'indicateurs') {
      setOptionsExport('identifiant');
    }
    if (typeExportADefinir === 'historique-indicateurs') {
      setOptionsExport('identifiant,valeur-cible,valeur-actuelle');
    }
    setTypeExport(typeExportADefinir);
  };

  return (
    <div>
      <p className='fr-mt-2w fr-mb-2w'>
        La fonctionnalité d’export de PILOTE vous permet de récupérer les données qui vous intéressent sur les PPG et
        leurs indicateurs dans les territoires.
      </p>
      <MiseEnAvant titre='Pour mener à bien votre export de données, vous allez être amené à :'>
        <ul>
          <li>
            indiquer les contenus dont vous souhaitez récupérer les données : les PPG, les indicateurs ou l’historique
            des indicateurs (étape 1);
          </li>
          <li>
            préciser le périmètre de votre export : le cas échéant, filtrage des PPG / indicateurs et sélection des
            territoires (étape 2);
          </li>
          <li>
            enfin – s’il ne s’agit pas d’un export d’historique – choisir les données que vous souhaitez collecter pour
            ces PPG / indicateurs, territoire par territoire : gouvernance, commentaires, données quantitatives, etc.
            (étape 3)
          </li>
        </ul>
      </MiseEnAvant>
      <p className='fr-my-1w'>
        Dans un premier temps, indiquez les contenus dont vous souhaitez exporter les données :
      </p>
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
      <div
        className='fr-fieldset__element'
        key='historique-indicateurs'
      >
        <div className='fr-radio-group'>
          <input
            checked={typeExport === 'historique-indicateurs'}
            id='historique-indicateurs'
            name='ressource-à-exporter'
            onChange={() => modifierTypeExport('historique-indicateurs')}
            type='radio'
          />
          <label
            className='fr-label'
            htmlFor='historique-indicateurs'
          >
            L'historique des indicateurs
          </label>
          <span
            className='fr-label fr-text--xs texte-gris fr-mb-0'
          >
            cet historique recense les valeurs actuelles prises successivement par les indicateurs des PPG, territoire par territoire
          </span>
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
