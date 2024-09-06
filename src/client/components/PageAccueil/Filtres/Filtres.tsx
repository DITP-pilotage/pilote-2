import { FunctionComponent } from 'react';
import FiltresSélectionMultiple
  from '@/components/PageAccueil/Filtres/FiltresSélectionMultiple/FiltresSélectionMultiple';
import { FiltreTypologieType } from '@/client/stores/useFiltresStore/useFiltresStore.interface';
import { filtresActifs } from '@/client/stores/useFiltresStore/useFiltresStore';
import Axe from '@/server/domain/axe/Axe.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import FiltresGroupe from './FiltresGroupe/FiltresGroupe';
import FiltresMinistères from './FiltresMinistères/FiltresMinistères';
import FiltreTypologie from './FiltreTypologie/FiltreTypologie';

interface BarreLatéraleProps {
  ministères: Ministère[],
  axes: Axe[],
  afficherToutLesFiltres: boolean
}

const filtreBaromètre: FiltreTypologieType = {
  id: 'filtreBaromètre',
  attribut: 'estBaromètre',
  nom: 'Chantiers du baromètre',
};
const filtreTerritorialisé: FiltreTypologieType = {
  id: 'filtreTerritorialisé',
  attribut: 'estTerritorialisé',
  nom: 'Chantiers territorialisés',
};

const Filtres: FunctionComponent<BarreLatéraleProps> = ({ ministères, axes, afficherToutLesFiltres }) => {
  filtresActifs();

  return (
    <>
      <section className='fr-px-3w'>
        <FiltresMinistères ministères={ministères} />
      </section>
      {
        afficherToutLesFiltres ? (
          <>
            <FiltresGroupe>
              <FiltresSélectionMultiple
                catégorieDeFiltre='axes'
                filtres={axes}
                libellé='Axes'
              />
            </FiltresGroupe>
            <hr className='fr-hr fr-mt-3w fr-pb-2w' />
            <FiltresGroupe libellé='Autres critères'>
              <FiltreTypologie filtre={filtreTerritorialisé} />
              <FiltreTypologie filtre={filtreBaromètre} />
            </FiltresGroupe>
          </>
        ) : null
}
    </>
  );
};

export default Filtres;
