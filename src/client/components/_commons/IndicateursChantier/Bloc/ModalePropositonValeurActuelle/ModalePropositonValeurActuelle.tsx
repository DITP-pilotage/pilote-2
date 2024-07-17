import { FunctionComponent } from 'react';
import {
  ID_HTML_MODALE_PROPOSITION_VALEUR_ACTUELLE,
} from '@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc';
import Modale from '@/components/_commons/Modale/Modale';

const ModalePropositonValeurActuelle: FunctionComponent<{}> = () => {
  return (
    <Modale
      idHtml={ID_HTML_MODALE_PROPOSITION_VALEUR_ACTUELLE}
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
        Émissions totales annuelles de gaz à effet de serre du parc de voitures (en tonne équivalent CO2)
      </h2>
      <span>
        Proposition d’une autre valeur actuelle
        La proposition de nouvelle valeur actuelle que vous éditez a été faite par François Pignon le 14/05/2024. Toute
        modification apportée à cette proposition écrasera et remplacera celle-ci.
      </span>
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
              hey 1
            </td>
            <td>
              hey 2
            </td>
          </tr>
        </tbody>
      </table>
    </Modale>
  );
};

export default ModalePropositonValeurActuelle;
