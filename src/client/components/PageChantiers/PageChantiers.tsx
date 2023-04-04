import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import { useState } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import SélecteursMaillesEtTerritoires from '@/components/_commons/SélecteursMaillesEtTerritoires/SélecteursMaillesEtTerritoires';
import Avancements from '@/components/_commons/Avancements/Avancements';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import Filtres from '@/components/PageChantiers/Filtres/Filtres';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import PageChantiersProps from './PageChantiers.interface';
import RépartitionMétéo from './RépartitionMétéo/RépartitionMétéo';
import FiltresActifs from './FiltresActifs/FiltresActifs';
import PageChantiersStyled from './PageChantiers.styled';
import TableauChantiers from './TableauChantiers/TableauChantiers';
import usePageChantiers from './usePageChantiers';

export default function PageChantiers({ chantiers, ministères, axes, ppg }: PageChantiersProps) {  
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const { auClicTerritoireCallback } = useCartographie();
  const { 
    nombreFiltresActifs, 
    chantiersFiltrés,
    avancements, 
    météos,
    donnéesCartographie,
    donnéesTableauChantiers,
  } = usePageChantiers(chantiers);

  return (
    <PageChantiersStyled className="flex">
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          <SélecteursMaillesEtTerritoires />
        </BarreLatéraleEncart>
        <section>
          <Titre
            baliseHtml="h1"
            className="fr-h4 fr-mb-1w fr-px-3w fr-mt-2w fr-col-8"
          >
            Filtres
          </Titre>
          <Filtres
            axes={axes}
            ministères={ministères}
            ppg={ppg}
          />
        </section>
      </BarreLatérale>
      <main>
        <button
          className="fr-sr-only-xl fr-btn fr-btn--secondary fr-mb-2w"
          onClick={() => setEstOuverteBarreLatérale(true)}
          title="Ouvrir les filtres"
          type="button"
        >
          Filtres
        </button>
        <div>
          {
            nombreFiltresActifs > 0 &&
            <FiltresActifs />
          }
          <div className="fr-py-2w fr-px-md-4w fr-container--fluid">
            <div className="fr-px-2w fr-px-md-0">
              <Titre
                baliseHtml='h1'
                className='fr-h4'
              >
                {`${chantiersFiltrés.length} chantiers`}
              </Titre>
            </div>
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-lg-6">
                <Bloc>
                  <section>
                    <Titre
                      baliseHtml='h2'
                      className='fr-h6'
                    >
                      Répartition géographique
                    </Titre>
                    <CartographieAvancement
                      auClicTerritoireCallback={auClicTerritoireCallback}
                      données={donnéesCartographie}
                      options={{ territoireSélectionnable: true }}
                    />
                  </section>
                </Bloc>
              </div>
              <div className="fr-col-12 fr-col-lg-6">
                <Bloc>
                  <section>
                    <Titre
                      baliseHtml='h2'
                      className='fr-h6'
                    >
                      Taux d’avancement moyen de la sélection
                    </Titre>
                    <Avancements avancements={avancements} />
                  </section>
                  <hr className='fr-hr fr-my-3w fr-pb-1v' />
                  <section>
                    <Titre
                      baliseHtml='h2'
                      className='fr-h6'
                    >
                      Répartition des météos de la sélection
                    </Titre>
                    <RépartitionMétéo météos={météos} />
                  </section>
                </Bloc>
              </div>
            </div>
            <div className="fr-grid-row fr-mt-7v">
              <div className="fr-col">
                <Bloc>
                  <TableauChantiers
                    données={donnéesTableauChantiers}
                  />
                </Bloc>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageChantiersStyled>
  );
}
