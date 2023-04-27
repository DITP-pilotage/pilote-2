/* eslint-disable react/jsx-max-depth */
import '@gouvfr/dsfr/dist/component/link/link.min.css';
import '@gouvfr/dsfr/dist/component/badge/badge.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import Link from 'next/link';
import PageRapportDétailléStyled from '@/components/PageRapportDétaillé/PageRapportDétaillé.styled';
import Titre from '@/components/_commons/Titre/Titre';
import PageRapportDétailléProps from '@/components/PageRapportDétaillé/PageRapportDétaillé.interface';
import { RapportDétailléVueDEnsemble } from '@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléVueDEnsemble';
import useChantiersFiltrés from '@/components/useChantiersFiltrés';
import RapportDétailléChantier from '@/components/PageRapportDétaillé/Chantier/RapportDétailléChantier';

export const htmlId = {
  listeDesChantiers: () => 'liste-des-chantiers',
  chantier: (chantierId: string) => `chantier-${chantierId}`,
};

export default function PageRapportDétaillé({ chantiers, indicateursGroupésParChantier, détailsIndicateursGroupésParChantier, publicationsGroupéesParChantier }: PageRapportDétailléProps) {
  const chantiersFiltrés = useChantiersFiltrés(chantiers);
  return (
    <PageRapportDétailléStyled>
      <main className="fr-py-4w">
        <div className="fr-container fr-mb-0 fr-px-0 fr-px-md-2w">
          <div className="première-page-impression">
            <header
              className="fr-header"
              role="banner"
            >
              <div className="fr-header__body">
                <div className="fr-container">
                  <div className="fr-header__body-row">
                    <div className="fr-header__brand fr-enlarge-link">
                      <div className="fr-header__brand-top">
                        <div className="fr-header__logo">
                          <p className="fr-logo">
                            République
                            <br />
                            Française
                          </p>
                        </div>
                      </div>
                      <div className="fr-header__service">
                        <p className="fr-header__service-title">
                          PILOTE
                        </p>
                        <p className="fr-header__service-tagline fr-hidden fr-unhidden-sm">
                          Piloter les politiques publiques par leurs impacts
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </header>
            <div className="titre-rapport-détaillé fr-display--xl fr-mt-12w" >
              Pilote - Chantiers prioritaires
            </div>
            <hr className='fr-hr fr-mt-4w fr-mb-6w' />
            <div className="sous-titre-rapport-détaillé fr-display--xl" >
              Rapport détaillé
            </div>
          </div>
          <div className="fr-px-2w fr-px-md-0 flex justify-between entête-rapport-détaillé">
            <Titre
              baliseHtml="h1"
              className="fr-h2"
            >
              {`Rapport détaillé : ${chantiersFiltrés.length} chantiers`}
            </Titre>
            <div>
              <Link
                className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-go-back-fill fr-btn--icon-left fr-text--sm"
                href="/"
                title="Revenir à l'accueil"
              >
                Revenir à l&apos;accueil
              </Link>
              <button
                className="fr-btn fr-btn--tertiary-no-outline fr-icon-printer-line fr-btn--icon-left fr-text--sm"
                onClick={() => window.print()}
                type="button"
              >
                Imprimer
              </button>
            </div>
          </div>
          <RapportDétailléVueDEnsemble chantiers={chantiersFiltrés} />
          {
            chantiersFiltrés.map((chantier) => (
              <RapportDétailléChantier
                chantier={chantier}
                commentaires={publicationsGroupéesParChantier.commentaires[chantier.id]}
                décisionStratégique={publicationsGroupéesParChantier.décisionStratégique[chantier.id]}
                détailsIndicateurs={détailsIndicateursGroupésParChantier[chantier.id]}
                indicateurs={indicateursGroupésParChantier[chantier.id]}
                key={chantier.id}
                objectifs={publicationsGroupéesParChantier.objectifs[chantier.id]}
                synthèseDesRésultats={publicationsGroupéesParChantier.synthèsesDesRésultats[chantier.id]}
              />
            ))
          }
        </div>
      </main>
    </PageRapportDétailléStyled>
  );
}
