import { FunctionComponent } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';

interface AvancementPageProjetStructurantProps {
  territoireNom: string
  avancement: number | null
}

const AvancementPageProjetStructurant: FunctionComponent<AvancementPageProjetStructurantProps> = ({ territoireNom, avancement }) => {
  return (
    <Bloc titre={territoireNom}>
      <div className='fr-grid-row fr-grid-row--center'>
        <JaugeDeProgression
          couleur='rose'
          libellé="Taux d'avancement global"
          pourcentage={avancement}
          taille='lg'
        />
      </div>
    </Bloc>
  );
};

export default AvancementPageProjetStructurant;
