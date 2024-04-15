import FiltresSélectionMultiple
  from '@/components/PageAccueil/FiltresNew/FiltresSélectionMultiple/FiltresSélectionMultiple';
import { FiltreTypologieType } from '@/client/stores/useFiltresStore/useFiltresStore.interface';
import { filtresActifs } from '@/client/stores/useFiltresStore/useFiltresStore';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import FiltresGroupe from './FiltresGroupe/FiltresGroupe';
import FiltresMinistères from './FiltresMinistères/FiltresMinistères';
import FiltreTypologie from './FiltreTypologie/FiltreTypologie';

const filtreBaromètre: FiltreTypologieType = { id: 'filtreBaromètre', attribut: 'estBaromètre', nom: 'Chantiers du baromètre' };
const filtreTerritorialisé: FiltreTypologieType = { id: 'filtreTerritorialisé', attribut: 'estTerritorialisé', nom: 'Chantiers territorialisés' };

interface FiltresProps {
  ministères: Ministère[],
  axes: Axe[],
  ppg: Ppg[],
  afficherToutLesFiltres: boolean
}

export default function Filtres({ ministères, axes, ppg, afficherToutLesFiltres }: FiltresProps) {
  filtresActifs();

  return (
    <>
      <section className='fr-px-3w'>
        <FiltresMinistères ministères={ministères} />
      </section>
      {
        !!afficherToutLesFiltres ? (
          <>
            <FiltresGroupe>
              <FiltresSélectionMultiple
                catégorieDeFiltre='axes'
                filtres={axes}
                libellé='Axes'
              />
              <FiltresSélectionMultiple
                catégorieDeFiltre='ppg'
                filtres={ppg}
                libellé='PPG'
              />
            </FiltresGroupe>
            <hr className='fr-hr fr-mt-3w fr-pb-2w' />
            <FiltresGroupe libellé='Autres critères'>
              <FiltreTypologie
                categorie='estTerritorialise'
                filtre={filtreTerritorialisé}
              />
              <FiltreTypologie
                categorie='estBarometre'
                filtre={filtreBaromètre}
              />
            </FiltresGroupe>
          </>
        ) : null
      }
    </>
  );
}
