import { FunctionComponent } from 'react';
import FiltresSélectionMultiple
  from '@/components/PageAccueil/FiltresNew/FiltresSélectionMultiple/FiltresSélectionMultiple';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import FiltresGroupe from './FiltresGroupe/FiltresGroupe';
import FiltresMinistères from './FiltresMinistères/FiltresMinistères';
import FiltreTypologie from './FiltreTypologie/FiltreTypologie';

const filtreBaromètre: {
  id: string,
  attribut: 'estBaromètre' | 'estTerritorialisé',
  nom: string
} = { id: 'filtreBaromètre', attribut: 'estBaromètre', nom: 'Chantiers du baromètre' };
const filtreTerritorialisé: {
  id: string,
  attribut: 'estBaromètre' | 'estTerritorialisé',
  nom: string
} = { id: 'filtreTerritorialisé', attribut: 'estTerritorialisé', nom: 'Chantiers territorialisés' };

interface FiltresProps {
  ministères: Ministère[],
  axes: Axe[],
  afficherToutLesFiltres: boolean
  estProfilTerritorialise: boolean
}

const Filtres: FunctionComponent<FiltresProps> = ({
  ministères,
  axes,
  afficherToutLesFiltres,
  estProfilTerritorialise,
}) => {
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
              {
                estProfilTerritorialise ? (
                  <FiltreTypologie
                    categorie='estTerritorialise'
                    filtre={filtreTerritorialisé}
                  />
                ) : null
              }
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
};

export default Filtres;
