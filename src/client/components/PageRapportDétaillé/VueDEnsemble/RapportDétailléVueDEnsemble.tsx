import Encart from '@/components/PageRapportDétaillé/Encart/Encart';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import Avancements from '@/components/_commons/Avancements/Avancements';
import RépartitionMétéo from '@/components/PageChantiers/RépartitionMétéo/RépartitionMétéo';
import RapportDétailléVueDEnsembleProps from '@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléVueDEnsemble.interface';
import usePageRapportDétaillé from '@/components/PageRapportDétaillé/usePageRapportDétaillé';
import RapportDétailléTableauChantiers from './RapportDétailléTableauChantiers/RapportDétailléTableauChantiers';

export function RapportDétailléVueDEnsemble({
  chantiers,
}: RapportDétailléVueDEnsembleProps) {
  const {
    avancementsAgrégés,
    répartitionMétéos,
    donnéesCartographie,
    donnéesTableauChantiers,
  } = usePageRapportDétaillé(chantiers);
  return (
    <section>
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
                options={{ territoireSélectionnable: true }}
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
      <div className="fr-grid-row fr-mt-7v">
        <div className="fr-col">
          <Bloc>
            <RapportDétailléTableauChantiers
              données={donnéesTableauChantiers}
            />
          </Bloc>
        </div>
      </div>
    </section>
  );
}
