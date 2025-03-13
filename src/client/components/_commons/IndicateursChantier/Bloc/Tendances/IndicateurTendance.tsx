import { FunctionComponent } from 'react';
import Icône from '@/components/_commons/Icône/Icône';

const IndicateurTendance: FunctionComponent<{}> = () => {

  return (
    <div className='flex flex-direction-row fr-ml-2w fr-mr-1w'>
      <p className='fr-text--xs fr-text-title--blue-france fr-mb-1w'>
        <span>
          <Icône id='material-symbols::trending_down::outlined' />
        </span>
      </p>
      <p className='fr-text--xs texte-gris fr-ml-1w fr-pt-1v fr-mb-1w'>
        Attention, cet indicateur a un objectif de baisse. La cible représente une valeur inférieure à la valeur
        initiale.
      </p>
    </div>
  );
};

export default IndicateurTendance;
