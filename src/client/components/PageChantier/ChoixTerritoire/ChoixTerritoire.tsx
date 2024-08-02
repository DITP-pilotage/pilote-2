import { FunctionComponent, useState } from 'react';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import BoutonSousLigné from '@/components/_commons/BoutonSousLigné/BoutonSousLigné';
import Loader from '@/components/_commons/Loader/Loader';
import SélecteursMaillesEtTerritoires
  from '@/components/_commons/SélecteursMaillesEtTerritoires/SélecteursMaillesEtTerritoires';
import PageChantierEnTête from '@/components/PageChantier/EnTête/EnTête';
import Cartographie from '@/components/_commons/Cartographie/CartographieNew';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import useChoixTerritoire from './useChoixTerritoire';

interface ChoixTerritoireProps {
  chantierId: Chantier['id']
  territoireCode: string
  mailleSélectionnée: MailleInterne
}

const ChoixTerritoire: FunctionComponent<ChoixTerritoireProps> = ({
  chantierId,
  territoireCode,
  mailleSélectionnée,
}) => {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const { chantier, donnéesCartographie } = useChoixTerritoire(chantierId, mailleSélectionnée);
  const { auClicTerritoireCallback } = useCartographie();

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
                territoireCode={territoireCode}
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
                        mailleSelectionnee={mailleSélectionnée}
                        pathname='/chantier/[id]/[territoireCode]'
                        territoireCode={territoireCode}
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
};

export default ChoixTerritoire;
