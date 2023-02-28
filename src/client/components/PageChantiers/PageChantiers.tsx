import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import { useState } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import SélecteursMaillesEtTerritoires from '@/components/_commons/SélecteursMaillesEtTerritoires/SélecteursMaillesEtTerritoires';
import Avancements from '@/components/_commons/Avancements/Avancements';
import usePageChantiers from '@/components/PageChantiers/usePageChantiers';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import Filtres from '@/components/PageChantiers/Filtres/Filtres';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import PageChantiersProps from './PageChantiers.interface';
import RépartitionMétéo from './RépartitionMétéo/RépartitionMétéo';
import ListeChantiers from './ListeChantiers/ListeChantiers';
import FiltresActifs from './FiltresActifs/FiltresActifs';
import PageChantiersStyled from './PageChantiers.styled';

export default function PageChantiers({ chantiers, ministères, axes, ppg }: PageChantiersProps) {  
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);

  const { nombreFiltresActifs, chantiersFiltrés, avancements, météos, donnéesCartographie } = usePageChantiers(chantiers);

  return (
    <PageChantiersStyled className="flex">
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          <SélecteursMaillesEtTerritoires />
        </BarreLatéraleEncart>
        <Filtres
          axes={axes}
          ministères={ministères}
          ppg={ppg}
        />
      </BarreLatérale>
      <div className='contenu-principal'>
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
          <div className="fr-p-4w fr-container">
            <Titre
              baliseHtml='h1'
              className='fr-h4'
            >
              {`${chantiersFiltrés.length} chantiers`}
            </Titre>
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-lg-6">
                <Bloc>
                  <Titre
                    baliseHtml='h2'
                    className='fr-h6'
                  >
                    Répartition géographique
                  </Titre>
                  <CartographieAvancement
                    données={donnéesCartographie}
                    options={{ territoireSélectionnable: true }}
                  />
                </Bloc>
              </div>
              <div className="fr-col-12 fr-col-lg-6">
                <Bloc>
                  <Titre
                    baliseHtml='h2'
                    className='fr-h6'
                  >
                    Taux d’avancement moyen de la sélection
                  </Titre>
                  <Avancements avancements={avancements} />
                  <hr className='fr-hr fr-my-3w fr-pb-1v' />
                  <RépartitionMétéo météos={météos} />
                </Bloc>
              </div>
            </div>
            <div className="fr-grid-row fr-mt-3w">
              <div className="fr-col">
                <Bloc>
                  <ListeChantiers chantiers={chantiersFiltrés}  />
                </Bloc>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageChantiersStyled>
  );
}
