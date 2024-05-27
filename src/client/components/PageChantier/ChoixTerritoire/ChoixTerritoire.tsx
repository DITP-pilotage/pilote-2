import { useState } from 'react';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import BoutonSousLigné from '@/components/_commons/BoutonSousLigné/BoutonSousLigné';
import Loader from '@/components/_commons/Loader/Loader';
import SélecteursMaillesEtTerritoires from '@/components/_commons/SélecteursMaillesEtTerritoires/SélecteursMaillesEtTerritoires';
import PageChantierEnTête from '@/client/components/PageChantier/EnTête/EnTête';
import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import { getFiltresActifs } from '@/client/stores/useFiltresStoreNew/useFiltresStoreNew';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import useChoixTerritoire from './useChoixTerritoire';
import ChoixTerritoireProps from './ChoixTerritoire.interface';

export default function ChoixTerritoire({ chantierId }: ChoixTerritoireProps) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const { chantier, donnéesCartographie } = useChoixTerritoire(chantierId);
  const { auClicTerritoireCallback } = useCartographie();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const filtresActifs = getFiltresActifs();
  const territoireCode = territoireSélectionné?.code;
  const queryParamString = new URLSearchParams(Object.entries(filtresActifs).map(([key, value]) => (value && String(value).length > 0 ? [key, String(value)] : [])).filter(value => value.length > 0)).toString();
  const hrefBoutonRetour = `/accueil/chantier/${territoireCode}${queryParamString.length > 0 ? `?${queryParamString}` : ''}`;

  return (
    <div className='flex'>
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          <SélecteursMaillesEtTerritoires />
        </BarreLatéraleEncart>
      </BarreLatérale>
      <main className='fr-pb-5w'>
        <BoutonSousLigné
          classNameSupplémentaires='fr-link--icon-left fr-fi-arrow-right-line fr-hidden-xl fr-m-2w'
          onClick={() => setEstOuverteBarreLatérale(true)}
          type='button'
        >
          Filtres
        </BoutonSousLigné>
        {
          chantier !== null ? (
            <>
              <PageChantierEnTête 
                chantier={chantier} 
                hrefBoutonRetour={hrefBoutonRetour} 
              />
              <div className='fr-grid-row fr-grid-row--gutters fr-grid-row--center fr-mt-5w fr-mx-1w'>
                <div className='fr-col-12 fr-col-xl-6'>
                  <Bloc>
                    <section>
                      <Titre
                        baliseHtml='h3'
                        className='fr-text--lg'
                      >
                        Veuillez sélectionner un DROM
                      </Titre>
                      <Cartographie
                        auClicTerritoireCallback={auClicTerritoireCallback}
                        données={donnéesCartographie}
                      />
                    </section>
                  </Bloc>
                </div>
              </div>
            </>
          ) : (
            <Loader />
          )
        } 
      </main>
    </div>
  );
}
