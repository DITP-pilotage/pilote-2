import { FunctionComponent, useState } from 'react';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
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
import { estLargeurDÉcranActuelleMoinsLargeQue } from '@/client/stores/useLargeurDÉcranStore/useLargeurDÉcranStore';
import useChoixTerritoire from './useChoixTerritoire';
import ChoixTerritoireStyled from './ChoixTerritoire.styled';

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
  const estVueMobile = estLargeurDÉcranActuelleMoinsLargeQue('md');
  const [estVisibleEnMobile, setEstVisibleEnMobile] = useState(false);
  const { chantier, donnéesCartographie } = useChoixTerritoire(chantierId, mailleSélectionnée);
  const { auClicTerritoireCallback } = useCartographie();

  return (
    <div className='flex'>
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          {
            estVueMobile && estVisibleEnMobile ? (
              <Titre
                baliseHtml='h3'
                className='fr-h6 fr-my-2w fr-col-8'
              >
                Maille géographique
              </Titre>
            ) : null
          }        
          <SélecteursMaillesEtTerritoires
            estVisibleEnMobile={estVisibleEnMobile}
            estVueMobile={estVueMobile}
          />
        </BarreLatéraleEncart>
      </BarreLatérale>
      <main className='fr-pb-5w'>
        <ChoixTerritoireStyled>     
          <div className='bouton-filtrer fr-hidden-lg fr-py-1w fr-px-1v'>
            <button
              className='fr-btn fr-btn--tertiary-no-outline fr-btn--icon-left fr-icon-equalizer-fill fr-text-title--blue-france'
              onClick={() => {
                setEstOuverteBarreLatérale(true); 
                setEstVisibleEnMobile(true);
              }}
              title='Explorer'
              type='button'
            >
              Explorer
            </button>
          </div>
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
        </ChoixTerritoireStyled>
      </main>
    </div>
  );
};

export default ChoixTerritoire;
