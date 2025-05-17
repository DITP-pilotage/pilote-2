import React, { useState } from 'react';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import Interrupteur from '@/components/_commons/Interrupteur/Interrupteur';

export const EtapeDonneeChantierACollecter = () => {
  const [optionsExport, setOptionsExport] = useQueryState('optionsExport', parseAsString.withDefault('identifiant').withOptions({
    shallow: true,
  }));

  const [, setEtapeCourante] = useQueryState('etapeCourante', parseAsInteger.withOptions({
    shallow: true,
    history: 'push',
  }));

  const [afficherDetail, setAfficherDetail] = useState<boolean>(false);

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
      <p className='fr-mt-2w fr-mb-0'>
        Sélectionnez les données que vous souhaitez collecter pour chaque chantier, territoire par territoire :
      </p>
      <div className='flex justify-end'>
        <Interrupteur
          auChangement={setAfficherDetail}
          checked={afficherDetail}
          className='fr-pb-0'
          direction='inverse'
          id='afficher-detail'
          libellé='afficher le détail'
        />
      </div>
      <div className='fr-fieldset__element fr-pl-0 fr-pb-2w border-b-2'>
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
            className='fr-label fr-text--sm fr-mb-0'
            htmlFor='identifiant'
          >
            <span>
              <span className='fr-text--bold'>
                identifiants
              </span>
              {' '}
              du chantier et du territoire
            </span>
          </label>
        </div>
        <div className='fr-checkbox-group fr-mt-1w'>
          <input
            checked={optionsExport.split(',').includes('gouvernance')}
            className='fr-input'
            id='gouvernance'
            name='gouvernance'
            onChange={() => onChangeOptionsExport('gouvernance')}
            type='checkbox'
          />
          {
            afficherDetail ? (
              <label
                className='fr-label fr-text--sm fr-mb-0'
                htmlFor='gouvernance'
              >
                <span>
                  <span className='fr-text--bold'>
                    gouvernance
                  </span>
                  {' '}
                  du chantier : tutelle, axe, spécificités (statut, présence dans le Baromètre, territorialisation,
                  restrictions géographiques)
                </span>
              </label>
            ) : (
              <label
                className='fr-label fr-text--sm fr-mb-0'
                htmlFor='gouvernance'
              >
                <span>
                  <span className='fr-text--bold'>
                    gouvernance
                  </span>
                  {' '}
                  du chantier
                </span>
              </label>
            )
          }
        </div>
        <div className='fr-checkbox-group fr-mt-1w'>
          <input
            checked={optionsExport.split(',').includes('responsabilite')}
            className='fr-input'
            id='responsabilite'
            name='responsabilite'
            onChange={() => onChangeOptionsExport('responsabilite')}
            type='checkbox'
          />
          {
            afficherDetail ? (
              <label
                className='fr-label fr-text--sm fr-mb-0'
                htmlFor='responsabilite'
              >
                <span>
                  <span className='fr-text--bold'>
                    responsabilité
                  </span>
                  {' '}
                  du chantier : directeurs, responsables et coordinateurs
                </span>
              </label>
            ) : (
              <label
                className='fr-label fr-text--sm fr-mb-0'
                htmlFor='responsabilite'
              >
                <span>
                  <span className='fr-text--bold'>
                    responsabilité
                  </span>
                  {' '}
                  du chantier
                </span>
              </label>
            )
          }
        </div>
        <div className='fr-checkbox-group fr-mt-1w'>
          <input
            checked={optionsExport.split(',').includes('objectif')}
            className='fr-input'
            id='objectif'
            name='objectif'
            onChange={() => onChangeOptionsExport('objectif')}
            type='checkbox'
          />
          {
            afficherDetail ? (
              <label
                className='fr-label fr-text--sm fr-mb-0'
                htmlFor='objectif'
              >
                <span>
                  <span className='fr-text--bold'>
                    objectifs
                  </span>
                  {' '}
                  du chantier: notre ambition, ce qui a déjà été fait, ce qui reste à faire
                </span>
              </label>
            ) : (
              <label
                className='fr-label fr-text--sm fr-mb-0'
                htmlFor='objectif'
              >
                <span>
                  <span className='fr-text--bold'>
                    objectifs
                  </span>
                  {' '}
                  du chantier
                </span>
              </label>
            )
          }
        </div>
      </div>
      <div className='fr-fieldset__element fr-pl-0 fr-pb-2w border-b-2'>
        <h3 className='fr-text--md underline fr-mb-0 fr-mt-2w'>
          DONNÉES QUANTITATIVES
        </h3>
        <div className='fr-checkbox-group fr-mt-1w'>
          <input
            checked={optionsExport.split(',').includes('description')}
            className='fr-input'
            id='description'
            name='description'
            onChange={() => onChangeOptionsExport('description')}
            type='checkbox'
          />
          {
            afficherDetail ? (
              <label
                className='fr-label fr-text--sm fr-mb-0'
                htmlFor='description'
              >
                <span>
                  <span className='fr-text--bold'>
                    données descriptives
                  </span>
                  {' '}
                  du chantier sur le territoire : taux d'avancement, tendance, écart
                </span>
              </label>
            ) : (
              <label
                className='fr-label fr-text--sm fr-mb-0'
                htmlFor='description'
              >
                <span>
                  <span className='fr-text--bold'>
                    données descriptives
                  </span>
                  {' '}
                  du chantier sur le territoire
                </span>
              </label>
            )
          }

        </div>
        <div className='fr-checkbox-group fr-mt-1w'>
          <input
            checked={optionsExport.split(',').includes('comparaison')}
            className='fr-input'
            id='comparaison'
            name='comparaison'
            onChange={() => onChangeOptionsExport('comparaison')}
            type='checkbox'
          />
          {
            afficherDetail ? (
              <label
                className='fr-label fr-text--sm fr-mb-0'
                htmlFor='comparaison'
              >
                <span>
                  <span className='fr-text--bold'>
                    données de comparaison
                  </span>
                  {' '}
                  du chantier aux mailles inférieures et supérieures (si applicable) : taux d'avancement, écart 
                </span>
              </label>
            ) : (
              <label
                className='fr-label fr-text--sm fr-mb-0'
                htmlFor='comparaison'
              >
                <span>
                  <span className='fr-text--bold'>
                    données de comparaison
                  </span>
                  {' '}
                  du chantier
                </span>
              </label>
            )
          }
        </div>
      </div>
      <div className='fr-fieldset__element fr-pl-0'>
        <h3 className='fr-text--md underline fr-mb-1w fr-mt-2w'>
          DONNÉES QUALITATIVES
        </h3>
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
            className='fr-label fr-text--sm fr-mb-0'
            htmlFor='synthese'
          >
            <span>
              <span className='fr-text--bold'>
                météo et synthèse des résultats
              </span>
              {' '}
              du chantier sur le territoire
            </span>
          </label>
        </div>
        <div className='fr-checkbox-group fr-mt-1w'>
          <input
            checked={optionsExport.split(',').includes('commentaire')}
            className='fr-input'
            id='commentaire'
            name='commentaire'
            onChange={() => onChangeOptionsExport('commentaire')}
            type='checkbox'
          />
          {
            afficherDetail ? (
              <>
                <label
                  className='fr-label fr-text--sm fr-mb-0'
                  htmlFor='commentaire'
                >
                  <span>
                    <span className='fr-text--bold'>
                      commentaires
                    </span>
                    {' '}
                    du chantier
                  </span>
                </label>
                <ul className='fr-ml-4w fr-my-0 fr-text--sm'>
                  <li className='fr-pb-0'>
                    sur les territoires départementaux et régionaux : commentaires sur les données, autres résultats
                    obtenus
                  </li>
                  <li className='fr-pb-0'>
                    sur le territoire national : autres résultats obtenus, risques et freins à lever, solutions et
                    actions à venir, exemples concrets de réussite
                  </li>
                </ul>
              </>
            ) : (
              <label
                className='fr-label fr-text--sm fr-mb-0'
                htmlFor='commentaire'
              >
                <span>
                  <span className='fr-text--bold'>
                    commentaires
                  </span>
                  {' '}
                  du chantier
                </span>
              </label>
            )
          }
        </div>
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
            className='fr-label fr-text--sm fr-mb-0'
            htmlFor='decision'
          >
            <span>
              suivi des
              {' '}
              <span className='fr-text--bold'>
                décisions stratégiques
              </span>
              {' '}
              du chantier
            </span>
          </label>
        </div>
      </div>
      <div className='w-full flex justify-end fr-mt-2w'>
        <button
          aria-controls='modale-exporter-les-données-v2'
          className='fr-link fr-mr-2w'
          title='Fermer la fenêtre modale'
          type='button'
        >
          Annuler
        </button>
        <button
          className='fr-btn fr-btn--secondary fr-mr-2w'
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
