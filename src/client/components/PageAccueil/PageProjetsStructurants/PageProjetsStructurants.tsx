import Titre from '@/client/components/_commons/Titre/Titre';
import FiltresActifs from '@/components/PageAccueil/FiltresActifs/FiltresActifs';
import Bloc from '@/client/components/_commons/Bloc/Bloc';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_PROJETS_STRUCTURANTS } from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import RépartitionMétéo from '@/components/PageAccueil/RépartitionMétéo/RépartitionMétéo';
import usePageProjetsStructurants from './usePageProjetsStructurants';
import PageProjetsStructurantsProps from './PageProjetsStructurants.interface';
import TableauProjetsStructurants from './TableauProjetsStructurants/TableauProjetsStructurants';

export default function PageProjetsStructurants({ projetsStructurants }: PageProjetsStructurantsProps) {
  const {
    projetsDuTerritoireSélectionné,
    projetsDuTerritoireSélectionnéEtTerritoiresEnfants,
    nombreFiltresActifs,
    donnéesCartographieAvancement,
    donnéesAvancementsMoyens,
    répartitionMétéos,
  } = usePageProjetsStructurants(projetsStructurants);
  
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
            {`${projetsDuTerritoireSélectionné.length} projets`}
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
                <CartographieAvancement
                  auClicTerritoireCallback={auClicTerritoireCallback}
                  données={donnéesCartographieAvancement}
                  élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_PROJETS_STRUCTURANTS}
                />
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
                <div className='fr-grid-row fr-grid-row--center'>
                  <JaugeDeProgression
                    couleur='rose'
                    libellé="Taux d'avancement global"
                    pourcentage={donnéesAvancementsMoyens}
                    taille='lg'
                  />
                </div>
              </section>
              <hr className="fr-hr fr-my-3w fr-pb-1v" />
              <section>
                <Titre
                  baliseHtml="h2"
                  className="fr-text--lg"
                >
                  Répartition des météos renseignées
                </Titre>
                <RépartitionMétéo météos={répartitionMétéos} />
              </section>
            </Bloc>
          </div>
        </div>
        <div className="fr-grid-row fr-mt-7v">
          <div className="fr-col">
            <Bloc>
              <TableauProjetsStructurants données={projetsDuTerritoireSélectionnéEtTerritoiresEnfants} />
            </Bloc>
          </div>
        </div>
      </div>
    </main>
  );
}
