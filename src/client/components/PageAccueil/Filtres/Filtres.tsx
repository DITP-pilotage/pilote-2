import { FunctionComponent } from 'react';
import { FiltresSelectionMultiple }
  from '@/components/PageAccueil/Filtres/FiltresSelectionMultiple/FiltresSelectionMultiple';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import FiltresGroupe from './FiltresGroupe/FiltresGroupe';
import FiltresMinistères from './FiltresMinistères/FiltresMinistères';
import { FiltresSelectionMultipleBoolean } from './FiltresSelectionMultipleBoolean/FiltresSelectionMultipleBoolean';

interface FiltresProps {
  ministères: Ministère[],
  axes: Axe[],
  afficherToutLesFiltres: boolean
  estProfilTerritorialise: boolean
}

export const Filtres: FunctionComponent<FiltresProps> = ({
  ministères,
  axes,
  afficherToutLesFiltres,
  estProfilTerritorialise,
}) => {

  return (
    <>
      <section className='fr-px-3w'>
        <FiltresMinistères
          ministères={ministères}
        />
      </section>
      {
        afficherToutLesFiltres ? (
          <FiltresGroupe>
            <FiltresSelectionMultiple
              catégorieDeFiltre='axes'
              filtres={axes}
              libellé='Filtrer par axes'
            />
            <FiltresSelectionMultipleBoolean
              libellé='Autres critères'
              listeCategorieDeFiltre={estProfilTerritorialise ? ['estBarometre', 'estTerritorialise'] : ['estBarometre']}
            />
          </FiltresGroupe>
        ) : null
      }
    </>
  );
};
