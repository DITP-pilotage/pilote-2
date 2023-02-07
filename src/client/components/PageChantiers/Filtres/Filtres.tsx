import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import FiltresGroupeDeCatégoriesDeFiltres from './FiltresGroupe/FiltresGroupe';
import FiltresMinistères from './FiltresMinistères/FiltresMinistères';
import BarreDeFiltresProps from './Filtres.interface';
import FiltresSélecteurs from './FiltresSélecteurs/FiltresSélecteurs';

export default function Filtres({ ministères }: BarreDeFiltresProps) {
  return (
    <>
      <BarreLatéraleEncart>
        <FiltresSélecteurs />
      </BarreLatéraleEncart>
      <p className="fr-h4 fr-mb-1w fr-px-3w fr-mt-2w fr-col-8">
        Filtres
      </p>
      <FiltresGroupeDeCatégoriesDeFiltres>
        <FiltresMinistères
          catégorieDeFiltre='périmètresMinistériels'
          libellé='Ministères'
          ministères={ministères}
        />
      </FiltresGroupeDeCatégoriesDeFiltres>
    </>
  );
}
