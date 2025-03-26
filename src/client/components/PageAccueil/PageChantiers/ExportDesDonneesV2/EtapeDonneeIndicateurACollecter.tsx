import React, { useState } from 'react';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import Interrupteur from '@/components/_commons/Interrupteur/Interrupteur';

export const EtapeDonneeIndicateurACollecter = () => {
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
        Sélectionnez les données que vous souhaitez collecter pour chaque indicateur et sa PPG associée, territoire par
        territoire :
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
            className='fr-label'
            htmlFor='identifiant'
          >
            <span>
              <span className='fr-text--bold fr-pr-1v'>
                identifiants
              </span>
              {' '}
              de l'indicateur, de la PPG associée et du territoire
            </span>
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

          {
            afficherDetail ? (
            <label
            className='fr-label'
            htmlFor='cadrage'
          >
            <span>
              <span className='fr-text--bold fr-pr-1v'>
                cadrage
              </span>
              {' '}
               de l'indicateur : description, méthode de calcul, source, périodes de mise à jour et de disponibilité
            </span>
          </label>
          ) : (
          <label
            className='fr-label'
            htmlFor='cadrage'
          >
            <span>
              <span className='fr-text--bold fr-pr-1v'>
                cadrage
              </span>
              {' '}
               de l'indicateur
            </span>
          </label>
          )
          }
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
          {
            afficherDetail ? (
              <>
                <label
                  className='fr-label'
                  htmlFor='gouvernance'
                >
                  <span>
                    <span className='fr-text--bold fr-pr-1v'>
                      gouvernance
                    </span>
                    {' '}
                  </span>
                </label>
                <ul className='fr-ml-4w fr-my-0 fr-text--sm'>
                  <li className='fr-pb-0'>
                    de l'indicateur: typologie, objectif de baisse, restrictions géographiques, présence dans le
                    Baromètre, pondérations aux différentes mailles
                  </li>
                  <li className='fr-pb-0'>
                    de la PPG associée: tutelle, axe et spécificités (statut, territorialisation, etc.)
                  </li>
                </ul>
              </>
            ) : (
              <label
                className='fr-label'
                htmlFor='gouvernance'
              >
                <span>
                  <span className='fr-text--bold fr-pr-1v'>
                    gouvernance
                  </span>
                  {' '}
                  de l'indicateur et de la PPG associée
                </span>
              </label>
            )
          }
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
          {
            afficherDetail ? (
            <label
              className='fr-label'
              htmlFor='responsabilite'
            >
              <span>
                <span className='fr-text--bold fr-pr-1v'>
                  responsabilités
                </span>
                {' '}
                 de l'indicateur et de la PPG associée : directeurs, responsables et coordinateurs
              </span>
            </label>
            ) : (
            <label
              className='fr-label'
              htmlFor='responsabilite'
            >
              <span>
                <span className='fr-text--bold fr-pr-1v'>
                  responsabilités
                </span>
                {' '}
                 de l'indicateur et de la PPG associée
              </span>
            </label>
            )
          }

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

          {
            afficherDetail ? (
              <label
                className='fr-label'
                htmlFor='objectif'
              >
                <span>
                  <span className='fr-text--bold fr-pr-1v'>
                    objectifs
                  </span>
                  {' '}
                   de la PPG associée
                </span>
              </label>
            ) : (
              <label
                className='fr-label'
                htmlFor='objectif'
              >
                <span>
                  <span className='fr-text--bold fr-pr-1v'>
                    objectifs
                  </span>
                  {' '}
                   de la PPG associée : notre ambition, ce qui a déjà été fait, ce qui reste à faire
                </span>
              </label>
            )
          }

        </div>
        */}
      </div>
      <div className='fr-fieldset__element fr-pl-0 fr-pb-2w border-b-2'>
        <h3 className='fr-text--md underline fr-mb-0 fr-mt-2w'>
          DONNÉES QUANTITATIVES
        </h3>
        <span
          className='fr-label fr-text--xs texte-gris fr-mb-0'
        >
          les données quantitatives sont exportées pour l'année en cours et pour l'année 2026
        </span>
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
              <>
                <label
                  className='fr-label'
                  htmlFor='description'
                >
                  <span>
                    <span className='fr-text--bold fr-pr-1v'>
                      données descriptives
                    </span>
                    {' '}
                    sur le territoire
                  </span>
                </label>
                <ul className='fr-ml-4w fr-my-0 fr-text--sm'>
                  <li className='fr-pb-0'>
                    de l'indicateur : valeurs initiale / actuelle / cible, taux d'avancement (si applicable)
                  </li>
                  <li className='fr-pb-0'>
                    de la PPG associée : taux d'avancement, tendance, écart
                  </li>
                </ul>
              </>
            ) : (
              <label
                className='fr-label'
                htmlFor='description'
              >
                <span>
                  <span className='fr-text--bold fr-pr-1v'>
                    données descriptives
                  </span>
                  {' '}
                  de l'indicateur et de la PPG associée sur le territoire
                </span>
              </label>
            )
          }
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
          {
            afficherDetail ? (
              <>
                <label
                  className='fr-label'
                  htmlFor='comparaison'
                >
                  <span>
                    <span className='fr-text--bold fr-pr-1v'>
                      données de comparaison
                    </span>
                    {' '}
                    de l'indicateur
                  </span>
                </label>
                <ul className='fr-ml-4w fr-my-0 fr-text--sm'>
                  <li className='fr-pb-0'>
                    taux d'avancement aux mailles inférieures et supérieures (si applicable)
                  </li>
                  <li className='fr-pb-0'>
                    minimum, médiane et maximum du taux d'avancement à toutes les mailles (si applicable)
                  </li>
                </ul>
              </>
            ) : (
              <label
                className='fr-label'
                htmlFor='comparaison'
              >
                <span>
                  <span className='fr-text--bold fr-pr-1v'>
                    données de comparaison
                  </span>
                  {' '}
                  de l'indicateur
                </span>
              </label>
            )
          }
        </div>
        */}
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
            className='fr-label'
            htmlFor='synthese'
          >
            <span>
              <span className='fr-text--bold fr-pr-1v'>
                météo et synthèse des résultats
              </span>
              {' '}
              de la PPG associée sur le territoire
            </span>
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
          {
            afficherDetail ? (
              <>
                <label
                  className='fr-label'
                  htmlFor='commentaire'
                >
                  <span>
                    <span className='fr-text--bold fr-pr-1v'>
                      commentaires
                    </span>
                    {' '}
                    de la PPG associée
                  </span>
                </label>
                <ul className='fr-ml-4w fr-my-0 fr-text--sm'>
                  <li className='fr-pb-0'>
                    sur les territoires départementaux et régionaux: commentaires sur les données, autres résultats obtenus
                  </li>
                  <li className='fr-pb-0'>
                    sur le territoire national: autres résultats obtenus, risques et freins à lever, solutions et actions à venir, exemples concrets de réussite
                  </li>
                </ul>
              </>
            ) : (
              <label
                className='fr-label'
                htmlFor='commentaire'
              >
                <span>
                  <span className='fr-text--bold fr-pr-1v'>
                    commentaires
                  </span>
                  {' '}
                  de la PPG associée
                </span>
              </label>
            )
          }
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
            <span>
              suivi des
              {' '}
               <span className='fr-text--bold fr-pr-1v'>
                décisions stratégiques
              </span>
              {' '}
               de la PPG associée
            </span>
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
