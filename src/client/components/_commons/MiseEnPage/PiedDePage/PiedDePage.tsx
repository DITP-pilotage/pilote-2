import '@gouvfr/dsfr/dist/component/footer/footer.min.css';
import Link from 'next/link';

export default function PiedDePage() {
  return (
    <footer
      className="fr-footer"
      id="footer"
      role="contentinfo"
    >
      <div className="fr-container">
        <div className="fr-footer__body">
          <div className="fr-footer__brand fr-enlarge-link">
            <Link
              href="/"
              title="Retour à l’accueil du site"
            >
              <p className="fr-logo">
                Gouvernement
              </p>
            </Link>
          </div>
          <div className="fr-footer__content">
            <p className="fr-footer__content-desc">
              PILOTE est le dispositif de suivi des politiques prioritaires du gouvernement. Il permet d’évaluer les résultats des politiques publiques dans les territoires. 
            </p>
            <ul className="fr-footer__content-list">
              <li className="fr-footer__content-item">
                <a
                  className="fr-footer__content-link"
                  href="https://legifrance.gouv.fr"
                  rel="noreferrer"
                  target="_blank"
                >
                  legifrance.gouv.fr
                </a>
              </li>
              <li className="fr-footer__content-item">
                <a
                  className="fr-footer__content-link"
                  href="https://gouvernement.fr"
                  rel="noreferrer"
                  target="_blank"
                >
                  gouvernement.fr
                </a>
              </li>
              <li className="fr-footer__content-item">
                <a
                  className="fr-footer__content-link"
                  href="https://service-public.fr"
                  rel="noreferrer"
                  target="_blank"
                >
                  service-public.fr
                </a>
              </li>
              <li className="fr-footer__content-item">
                <a
                  className="fr-footer__content-link"
                  href="https://data.gouv.fr"
                  rel="noreferrer"
                  target="_blank"
                >
                  data.gouv.fr
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="fr-footer__bottom">
          <ul className="fr-footer__bottom-list">
            <li className="fr-footer__bottom-item">
              <p className="fr-footer__bottom-link fr-mb-0">
                Accessibilité : non conforme
              </p>
            </li>
          </ul>
          <div className="fr-footer__bottom-copy">
            <p>
              Sauf mention contraire, tous les contenus de ce site sont sous
              {' '}
              <a
                href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
                target="_blank"
              >
                licence
                etalab-2.0
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
