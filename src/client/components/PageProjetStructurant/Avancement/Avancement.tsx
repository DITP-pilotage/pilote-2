import Bloc from '@/components/_commons/Bloc/Bloc';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import AvancementPageProjetStructurantProps from './Avancement.interface';

export default function AvancementPageProjetStructurant({ territoireNom, avancement }: AvancementPageProjetStructurantProps) {
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
}
