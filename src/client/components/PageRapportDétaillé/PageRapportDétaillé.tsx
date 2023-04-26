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
          <div className="fr-px-2w fr-px-md-0 flex justify-between">
            <Titre
              baliseHtml="h1"
              className="fr-h2"
            >
              {`Rapport détaillé : ${chantiersFiltrés.length} chantiers`}
            </Titre>
            <div className="non-imprimé">
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
              //i > 4 ? null :
              <RapportDétailléChantier
                chantier={chantier}
                commentaires={publicationsGroupéesParChantier.commentaires[chantier.id]}
                détailsIndicateurs={détailsIndicateursGroupésParChantier[chantier.id]}
                indicateurs={indicateursGroupésParChantier[chantier.id]}
                key={chantier.id}
                synthèseDesRésultats={publicationsGroupéesParChantier.synthèsesDesRésultats[chantier.id]}
              />
            ))
          }
        </div>
      </main>
    </PageRapportDétailléStyled>
  );
}
