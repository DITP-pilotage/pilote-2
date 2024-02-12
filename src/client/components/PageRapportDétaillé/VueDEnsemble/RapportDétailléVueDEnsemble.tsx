import Encart from '@/components/_commons/Encart/Encart';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import Avancements from '@/components/_commons/Avancements/Avancements';
import RépartitionMétéo from '@/components/_commons/RépartitionMétéo/RépartitionMétéo';
import RapportDétailléVueDEnsembleProps
  from '@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléVueDEnsemble.interface';
import usePageRapportDétaillé from '@/components/PageRapportDétaillé/usePageRapportDétaillé';
import { htmlId } from '@/components/PageRapportDétaillé/PageRapportDétaillé';
import {
  ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
} from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import RapportDétailléVueDEnsembleStyled
  from '@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléVueDEnsemble.styled';
import TitreInfobulleConteneur from '@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur';
import BadgeIcône from '@/components/_commons/BadgeIcône/BadgeIcône';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import RemontéeAlerte from '@/components/_commons/RemontéeAlerte/RemontéeAlerte';
import RapportDétailléTableauChantiers from './RapportDétailléTableauChantiers/RapportDétailléTableauChantiers';

export function RapportDétailléVueDEnsemble({ chantiers }: RapportDétailléVueDEnsembleProps) {
  const {
    avancementsAgrégés,
    répartitionMétéos,
    donnéesCartographie,
    donnéesTableauChantiers,
    remontéesAlertes,
  } = usePageRapportDétaillé(chantiers);
  
  return (
    <RapportDétailléVueDEnsembleStyled>
      <Encart>
        <Titre
          baliseHtml='h2'
          className='fr-h2 fr-mb-0'
        >
          Vue d'ensemble
        </Titre>
      </Encart>
      <div className='fr-mt-3w avancements-météos-carto'>
        <Bloc>
          <section>
            <TitreInfobulleConteneur>
              <Titre
                baliseHtml='h2'
                className='fr-text--lg fr-mb-2w fr-py-1v'
                estInline
              >
                Taux d’avancement moyen
              </Titre>
              <Infobulle idHtml='infobulle-chantiers-jauges'>
                { INFOBULLE_CONTENUS.chantiers.jauges }
              </Infobulle>
            </TitreInfobulleConteneur>
            <Avancements avancements={avancementsAgrégés} />
          </section>
          <hr className='fr-hr fr-my-3w fr-pb-1v' />
          <section>
            <TitreInfobulleConteneur>
              <Titre
                baliseHtml='h2'
                className='fr-text--lg fr-mb-0 fr-py-1v'
                estInline
              >
                Répartition des météos renseignées
              </Titre>
              <Infobulle idHtml='infobulle-chantiers-météos'>
                { INFOBULLE_CONTENUS.chantiers.météos }
              </Infobulle>
            </TitreInfobulleConteneur>
            <RépartitionMétéo météos={répartitionMétéos} />
          </section>
        </Bloc>
        <Bloc>
          <section>
            <Titre
              baliseHtml='h3'
              className='fr-text--lg fr-mb-0 fr-py-1v'
            >
              Taux d’avancement des chantiers par territoire
            </Titre>
            <CartographieAvancement
              auClicTerritoireCallback={() => {}}
              données={donnéesCartographie}
              options={{ estInteractif: false }}
              élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS}
            />
          </section>
        </Bloc>
      </div>
      {
        process.env.NEXT_PUBLIC_FF_ALERTES === 'true' &&
        <div className='fr-pt-3w fr-px-2w fr-px-md-0 alertes'>
          <div className='fr-mb-2w'>
            <TitreInfobulleConteneur>
              <BadgeIcône type='warning' />
              <Titre
                baliseHtml='h2'
                className='fr-text--lg fr-mb-0 fr-py-1v fr-ml-1w titre-remontée-alertes'
                estInline
              >
                Chantiers signalés
              </Titre>
              <Infobulle idHtml='infobulle-chantiers-alertes'>
                { INFOBULLE_CONTENUS.chantiers.alertes }
              </Infobulle>
            </TitreInfobulleConteneur>
          </div>
          <div className='fr-grid-row fr-grid-row--gutters'>
            {
              remontéesAlertes.map(({ nomCritère, libellé, nombre, estActivée }) => (
                (process.env.NEXT_PUBLIC_FF_ALERTES_BAISSE === 'true' || nomCritère !== 'estEnAlerteBaisseOuStagnation') &&
                  <div
                    className='fr-col'
                    key={libellé}
                  >
                    <RemontéeAlerte
                      estActivée={estActivée}
                      libellé={libellé}
                      nombre={nombre}
                    />
                  </div>
              ))
            }
          </div>
        </div>
      }
      <div
        className='fr-grid-row fr-mt-7v'
        id={htmlId.listeDesChantiers()}
      >
        <div className='fr-col'>
          <Bloc>
            <TitreInfobulleConteneur className='fr-mb-1w'>
              <Titre
                baliseHtml='h2'
                className='fr-text--lg fr-mb-0 fr-py-1v'
                estInline
              >
                Liste des chantiers
              </Titre>
              <Infobulle idHtml='infobulle-chantiers-listeDesChantiers'>
                { INFOBULLE_CONTENUS.chantiers.listeDesChantiers }
              </Infobulle>
            </TitreInfobulleConteneur>
            <RapportDétailléTableauChantiers
              données={donnéesTableauChantiers}
            />
          </Bloc>
        </div>
      </div>
    </RapportDétailléVueDEnsembleStyled>
  );
}
