import FiltresSélectionMultiple from '@/components/PageChantiers/Filtres/FiltresSélectionMultiple/FiltresSélectionMultiple';
import { FiltreFeuilleDeRoute } from '@/client/stores/useFiltresStore/useFiltresStore.interface';
import FiltresGroupe from './FiltresGroupe/FiltresGroupe';
import FiltresMinistères from './FiltresMinistères/FiltresMinistères';
import FiltresProps from './Filtres.interface';
import FiltresFeuilleDeRoute from './FiltresFeuilleDeRoute/FiltresFeuilleDeRoute';

const filtreBaromètre: FiltreFeuilleDeRoute = { id: 'filtreBaromètre', attribut: 'estBaromètre', nom: 'Chantiers du baromètre' };
const filtreTerritorialisé: FiltreFeuilleDeRoute = { id: 'filtreTerritorialisé', attribut: 'estTerritorialisé', nom: 'Chantiers territorialisés' };

export default function Filtres({ ministères, axes, ppg }: FiltresProps) {
  return (
    <>
      <FiltresGroupe>
        <FiltresMinistères ministères={ministères} />
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
      </FiltresGroupe>
      <hr className='fr-hr fr-mt-3w fr-pb-2w' />
      <FiltresGroupe libellé='Autres critères'>
        <FiltresFeuilleDeRoute filtres={[filtreTerritorialisé, filtreBaromètre]} />
      </FiltresGroupe>
    </>
  );
}
