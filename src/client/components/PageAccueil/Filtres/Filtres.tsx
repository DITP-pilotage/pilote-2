import FiltresSélectionMultiple from '@/components/PageAccueil/Filtres/FiltresSélectionMultiple/FiltresSélectionMultiple';
import { FiltreTypologieType } from '@/client/stores/useFiltresStore/useFiltresStore.interface';
import { filtresActifs } from '@/client/stores/useFiltresStore/useFiltresStore';
import FiltresGroupe from './FiltresGroupe/FiltresGroupe';
import FiltresMinistères from './FiltresMinistères/FiltresMinistères';
import FiltresProps from './Filtres.interface';
import FiltreTypologie from './FiltreTypologie/FiltreTypologie';

const filtreBaromètre: FiltreTypologieType = { id: 'filtreBaromètre', attribut: 'estBaromètre', nom: 'Chantiers du baromètre' };
const filtreTerritorialisé: FiltreTypologieType = { id: 'filtreTerritorialisé', attribut: 'estTerritorialisé', nom: 'Chantiers territorialisés' };

export default function Filtres({ ministères, axes, ppgs, afficherToutLesFiltres }: FiltresProps) {
  filtresActifs();

  return (
    <>
      <section className='fr-px-3w'>
        <FiltresMinistères ministères={ministères} />
      </section>
      {!!afficherToutLesFiltres &&
        <>
          <FiltresGroupe>
            <FiltresSélectionMultiple
              catégorieDeFiltre='axes'
              filtres={axes}
              libellé='Axes'
            />
            <FiltresSélectionMultiple
              catégorieDeFiltre='ppg'
              filtres={ppgs}
              libellé='PPG'
            />
          </FiltresGroupe>
          <hr className='fr-hr fr-mt-3w fr-pb-2w' />
          <FiltresGroupe libellé='Autres critères'>
            <FiltreTypologie filtre={filtreTerritorialisé} /> 
            <FiltreTypologie filtre={filtreBaromètre} /> 
          </FiltresGroupe>
        </>}
    </>
  );
}
