import Titre from '@/client/components/_commons/Titre/Titre';
import FiltresActifs from '@/client/components/PageChantiers/FiltresActifs/FiltresActifs';
import Bloc from '@/client/components/_commons/Bloc/Bloc';
import CartographieAvancement from '@/client/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import Avancements from '@/client/components/_commons/Avancements/Avancements';
import RépartitionMétéo from '@/client/components/PageChantiers/RépartitionMétéo/RépartitionMétéo';
import useCartographie from '@/client/components/_commons/Cartographie/useCartographie';
import usePageProjetsStructurants from './usePageProjetsStructurants';
import PageProjetsStructurantsProps from './PageProjetsStructurants.interface';

export default function PageProjetsStructurants({ projetsStructurants }: PageProjetsStructurantsProps) {
  const { nombreFiltresActifs } = usePageProjetsStructurants();
  const { auClicTerritoireCallback } = useCartographie();

  return (
    <main>
      {
        nombreFiltresActifs > 0 &&
        <FiltresActifs />
      }
      <div className="fr-py-2w fr-px-md-4w fr-container--fluid">
        <div className="fr-px-2w fr-px-md-0 flex justify-between">

          <Titre
            baliseHtml="h1"
            className='fr-h4'
          >
            {`${projetsStructurants.length} projets`}
          </Titre>
        </div>
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-lg-6">
            <Bloc>
              <section>
                <Titre
                  baliseHtml="h2"
                  className="fr-text--lg"
                >
                  Taux d’avancement des projets structurants par territoire
                </Titre>
                {/* <CartographieAvancement
                  auClicTerritoireCallback={auClicTerritoireCallback}
                  données={donnéesCartographie}
                /> */}
              </section>
            </Bloc>
          </div>
          <div className="fr-col-12 fr-col-lg-6">
            <Bloc>
              <section>
                <Titre
                  baliseHtml="h2"
                  className="fr-text--lg"
                >
                  Taux d’avancement moyen
                </Titre>
                {/* <Avancements avancements={avancementsAgrégés} /> */}
              </section>
              <hr className="fr-hr fr-my-3w fr-pb-1v" />
              <section>
                <Titre
                  baliseHtml="h2"
                  className="fr-text--lg"
                >
                  Répartition des météos renseignées
                </Titre>
                {/* <RépartitionMétéo météos={répartitionMétéos} /> */}
              </section>
            </Bloc>
          </div>
        </div>
        <div className="fr-grid-row fr-mt-7v">
          <div className="fr-col">
            <Bloc>
              {/* <TableauChantiers données={donnéesTableauChantiers} /> */}
            </Bloc>
          </div>
        </div>
      </div>
    </main>
  );
}
