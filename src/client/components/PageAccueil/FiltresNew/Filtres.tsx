import FiltresSélectionMultiple
  from '@/components/PageAccueil/FiltresNew/FiltresSélectionMultiple/FiltresSélectionMultiple';
import { filtresActifs } from '@/client/stores/useFiltresStoreNew/useFiltresStore';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import FiltresGroupe from './FiltresGroupe/FiltresGroupe';
import FiltresMinistères from './FiltresMinistères/FiltresMinistères';
import FiltreTypologie from './FiltreTypologie/FiltreTypologie';

const filtreBaromètre: { id: string, attribut: 'estBaromètre' | 'estTerritorialisé', nom: string } = { id: 'filtreBaromètre', attribut: 'estBaromètre', nom: 'Chantiers du baromètre' };
const filtreTerritorialisé: { id: string, attribut: 'estBaromètre' | 'estTerritorialisé', nom: string } = { id: 'filtreTerritorialisé', attribut: 'estTerritorialisé', nom: 'Chantiers territorialisés' };

interface FiltresProps {
  ministères: Ministère[],
  axes: Axe[],
  ppg: Ppg[],
  afficherToutLesFiltres: boolean
}

export default function Filtres({ ministères, axes, ppg, afficherToutLesFiltres }: FiltresProps) {
  filtresActifs(); // Totalement inutile mais casse les filtres si supprimé .....

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
