import FiltresSélectionMultiple from '@/components/PageChantiers/Filtres/FiltresSélectionMultiple/FiltresSélectionMultiple';
import FiltresGroupeDeCatégoriesDeFiltres from './FiltresGroupe/FiltresGroupe';
import FiltresMinistères from './FiltresMinistères/FiltresMinistères';
import FiltresProps from './Filtres.interface';
import FiltreBaromètre from './FiltreBaromètre/FiltreBaromètre';

export default function Filtres({ ministères, axes, ppg }: FiltresProps) {
  return (
    <>
      <FiltresGroupeDeCatégoriesDeFiltres>
        <FiltresMinistères
          catégorieDeFiltre='périmètresMinistériels'
          libellé='Ministères'
          ministères={ministères}
        />
        <FiltresSélectionMultiple
          catégorieDeFiltre='axes'
          filtres={axes}
          libellé="Axes"
        />
        <FiltresSélectionMultiple
          catégorieDeFiltre='ppg'
          filtres={ppg}
          libellé="PPG"
        />
      </FiltresGroupeDeCatégoriesDeFiltres>
      <hr className='fr-hr fr-mt-3w fr-pb-2w' />
      <FiltresGroupeDeCatégoriesDeFiltres libellé='Autres critères'>
        <FiltreBaromètre catégorieDeFiltre='autresFiltres' />
      </FiltresGroupeDeCatégoriesDeFiltres>
    </>
  );
}
