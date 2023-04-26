import '@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import Link from 'next/link';
import PageRapportDétailléStyled from '@/components/PageRapportDétaillé/PageRapportDétaillé.styled';
import Titre from '@/components/_commons/Titre/Titre';
import PageRapportDétailléProps from '@/components/PageRapportDétaillé/PageRapportDétaillé.interface';
import { RapportDétailléVueDEnsemble } from '@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléVueDEnsemble';
import useChantiersFiltrés from '@/components/useChantiersFiltrés';

export default function PageRapportDétaillé({ chantiers }: PageRapportDétailléProps) {
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
              <div
                className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-go-back-fill fr-btn--icon-left fr-text--sm"
              >
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
          <RapportDétailléVueDEnsemble chantiers={chantiersFiltrés} />
        </div>
      </main>
    </PageRapportDétailléStyled>
  );
}
