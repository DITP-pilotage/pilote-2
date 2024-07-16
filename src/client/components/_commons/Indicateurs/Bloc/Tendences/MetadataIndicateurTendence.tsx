import { FunctionComponent } from 'react';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';

interface MetadataIndicateurTendenceProps {
  indicateur: MetadataParametrageIndicateurContrat
}

const MetadataIndicateurTendance: FunctionComponent<MetadataIndicateurTendenceProps> = ({ indicateur }) => {
 
  return (
    indicateur.tendance === 'BAISSE' ? (
      <div>
        <p className='fr-text--xs texte-gris fr-ml-2w fr-mb-2w'>
          <span
            aria-hidden='true'
            className='fr-icon-arrow-right-fill'
          />
          {' '}               
          Attention, cet indicateur a un objectif de baisse. La cible représente une valeur inférieure à la valeur initiale.
        </p>
      </div>
    ) : null
  );
};


export default MetadataIndicateurTendance;
