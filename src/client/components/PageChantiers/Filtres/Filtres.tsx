import FiltresGroupeDeCatégoriesDeFiltres from './FiltresGroupe/FiltresGroupe';
import FiltresMinistères from './FiltresMinistères/FiltresMinistères';
import BarreDeFiltresProps from './Filtres.interface';
import FiltresSélecteurs from './FiltresSélecteurs/FitlresSélecteurs';

export default function Filtres({ ministères }: BarreDeFiltresProps) {
  return (
    <>
      <FiltresSélecteurs />
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
