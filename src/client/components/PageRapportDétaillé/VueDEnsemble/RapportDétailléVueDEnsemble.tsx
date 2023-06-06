import Encart from '@/components/PageRapportDétaillé/Encart/Encart';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import Avancements from '@/components/_commons/Avancements/Avancements';
import RépartitionMétéo from '@/components/_commons/RépartitionMétéo/RépartitionMétéo';
import RapportDétailléVueDEnsembleProps from '@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléVueDEnsemble.interface';
import usePageRapportDétaillé from '@/components/PageRapportDétaillé/usePageRapportDétaillé';
import { htmlId } from '@/components/PageRapportDétaillé/PageRapportDétaillé';
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import RapportDétailléVueDEnsembleStyled
  from '@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléVueDEnsemble.styled';
import RapportDétailléTableauChantiers from './RapportDétailléTableauChantiers/RapportDétailléTableauChantiers';

export function RapportDétailléVueDEnsemble({ chantiers }: RapportDétailléVueDEnsembleProps) {
  const {
    avancementsAgrégés,
    répartitionMétéos,
    donnéesCartographie,
    donnéesTableauChantiers,
  } = usePageRapportDétaillé(chantiers);
  
  return (
    <RapportDétailléVueDEnsembleStyled>
      <Encart>
        <Titre
          baliseHtml="h2"
          className="fr-h2 fr-mb-0"
        >
          Vue d&apos;ensemble
        </Titre>
      </Encart>
      <div className="fr-grid-row fr-grid-row--gutters fr-mt-2w">
        <div className="fr-col-12 fr-col-lg-6">
          <Bloc>
            <section>
              <Titre
                baliseHtml="h3"
                className="fr-text--lg"
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
        <div className="fr-col-12 fr-col-lg-6">
          <Bloc>
            <section>
              <Titre
                baliseHtml="h3"
                className="fr-text--lg"
              >
                Taux d’avancement moyen
              </Titre>
              <Avancements avancements={avancementsAgrégés} />
            </section>
            <hr className="fr-hr fr-my-3w fr-pb-1v" />
            <section>
              <Titre
                baliseHtml="h3"
                className="fr-text--lg"
              >
                Répartition des météos renseignées
              </Titre>
              <RépartitionMétéo météos={répartitionMétéos} />
            </section>
          </Bloc>
        </div>
      </div>
      <div
        className="fr-grid-row fr-mt-7v"
        id={htmlId.listeDesChantiers()}
      >
        <div className="fr-col">
          <Bloc>
            <Titre
              baliseHtml="h2"
              className="fr-text--lg fr-mb-2w titre-liste-chantiers"
            >
              Liste des chantiers
            </Titre>
            <RapportDétailléTableauChantiers
              données={donnéesTableauChantiers}
            />
          </Bloc>
        </div>
      </div>
    </RapportDétailléVueDEnsembleStyled>
  );
}
