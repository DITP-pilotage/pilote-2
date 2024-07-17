import { FunctionComponent, useState } from 'react';
import Modale from '@/components/_commons/Modale/Modale';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import type { DétailsIndicateur } from '@/server/domain/indicateur/DétailsIndicateur.interface';

import useModalePropositonValeurActuelle
  from '@/components/_commons/IndicateursChantier/Bloc/ModalePropositonValeurActuelle/useModalePropositonValeurActuelle';
import Input from '@/components/_commons/Input/Input';


enum EtapePropositionValeurActuelle {
  SAISIE_VALEUR_ACTUELLE = 'SAISIE_VALEUR_ACTUELLE',
  VALIDATION_VALEUR_ACTUELLE = 'VALIDATION_VALEUR_ACTUELLE',
}

const ModalePropositonValeurActuelle: FunctionComponent<{
  indicateur: Indicateur,
  detailIndicateur: DétailsIndicateur
  generatedHTMLID: string
}> = ({ indicateur, detailIndicateur, generatedHTMLID }) => {

  const reactHookForm = useModalePropositonValeurActuelle({ indicateur, detailIndicateur });

  const [etapePropositionValeurActuelle, setEtapePropositionValeurActuelle] = useState<EtapePropositionValeurActuelle>(EtapePropositionValeurActuelle.SAISIE_VALEUR_ACTUELLE);

  return (
    <Modale
      idHtml={generatedHTMLID}
      tailleModale='lg'
    >
      <div className='fr-stepper'>
        <h2 className='fr-stepper__title'>
          <span>
            Saisie de la proposition
          </span>
          <span className='fr-stepper__state'>
            Proposition d'une autre valeur actuelle - Étape 1 sur 2
          </span>
        </h2>
        <div
          className='fr-stepper__steps'
          data-fr-current-step='1'
          data-fr-steps='3'
        />
        <p className='fr-stepper__details'>
          <span className='fr-text--bold'>
            Étape suivante :
          </span>
          {' '}
          Validation de la proposition
        </p>
      </div>
      <h2 className='fr-h4'>
        {indicateur.nom}
      </h2>
      {
        etapePropositionValeurActuelle === EtapePropositionValeurActuelle.SAISIE_VALEUR_ACTUELLE ? (
          <>
            <table
              className='fr-table w-full border-spacing-1-0'
            >
              <thead>
                <tr className='fr-background-action-low-blue-france'>
                  <th className='w-half-full'>
                    <span className='w-full flex justify-center'>
                      Valeur actuelle importée par la direction de projet
                    </span>
                  </th>
                  <th>
                    <span className='w-full flex justify-center'>
                      Proposition de nouvelle valeur actuelle
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {detailIndicateur.valeurActuelle}
                  </td>
                  <td>
                    <div className='flex justify-center'>
                      <div className='w-half-full'>
                        <Input
                          erreurMessage={reactHookForm.formState.errors.valeurActuelle?.message}
                          htmlName='valeurActuelle'
                          register={reactHookForm.register('valeurActuelle')}
                          type='text'
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className='w-full flex justify-end'>
              <button
                className='fr-btn'
                onClick={() => setEtapePropositionValeurActuelle(EtapePropositionValeurActuelle.VALIDATION_VALEUR_ACTUELLE)}
                type='button'
              >
                Étape suivante
              </button>
            </div>
          </>
        ) : (
          <span>
            test
            {reactHookForm.getValues('valeurActuelle')}
          </span>
        )
      }
    </Modale>
  );
};

export default ModalePropositonValeurActuelle;
