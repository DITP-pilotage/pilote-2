import '@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import Link from 'next/link';
import PageRapportDétailléStyled from '@/components/PageRapportDétaillé/PageRapportDétaillé.styled';
import Titre from '@/components/_commons/Titre/Titre';
import PageRapportDétailléProps from '@/components/PageRapportDétaillé/PageRapportDétaillé.interface';
import Encart from '@/components/PageRapportDétaillé/Encart/Encart';
import Bloc from '@/components/_commons/Bloc/Bloc';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import Avancements from '@/components/_commons/Avancements/Avancements';
import RépartitionMétéo from '@/components/PageChantiers/RépartitionMétéo/RépartitionMétéo';
import usePageChantiers from '@/components/PageChantiers/usePageChantiers';
import RapportDétailléTableauChantiers
  from '@/components/PageRapportDétaillé/RapportDétailléTableauChantiers/RapportDétailléTableauChantiers';

export default function PageRapportDétaillé({ chantiers }: PageRapportDétailléProps) {
  const {
    chantiersFiltrés,
    avancements,
    météos,
    donnéesCartographie,
    donnéesTableauChantiers,
  } = usePageChantiers(chantiers);
  return (
    <PageRapportDétailléStyled>
      <main className="fr-py-4w">
        <div className="fr-container fr-mb-0 fr-px-0 fr-px-md-2w">
          <div className="fr-px-2w fr-px-md-0 flex justify-between">
            <Titre
              baliseHtml="h1"
              className="fr-h2"
            >
              {`Rapport détaillé : ${ chantiersFiltrés.length } chantiers`}
            </Titre>
            <div className="non-imprimé">
              <div className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-go-back-fill fr-btn--icon-left fr-text--sm">
                <Link
                  href="/"
                  title="Revenir à l'accueil"
                >
                  Revenir à l&apos;accueil
                </Link>
              </div>
              <button
                className="fr-btn fr-btn--tertiary-no-outline fr-icon-printer-line fr-btn--icon-left fr-text--sm"
                onClick={() => window.print()}
                type="button"
              >
                Imprimer
              </button>
            </div>
          </div>
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
                    baliseHtml='h2'
                    className='fr-h6'
                  >
                    Répartition géographique
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
                <RapportDétailléTableauChantiers
                  données={donnéesTableauChantiers}
                />
              </Bloc>
            </div>
          </div>
        </div>
      </main>
    </PageRapportDétailléStyled>
  );
}
