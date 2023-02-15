import '@gouvfr/dsfr/dist/component/header/header.min.css';
import '@gouvfr/dsfr/dist/component/logo/logo.min.css';
import Link from 'next/link';
import Navigation from '@/components/_commons/MiseEnPage/Navigation/Navigation';
import CompteUtilisateur from '@/components/_commons/MiseEnPage/EnTête/CompteUtilisateur';

export default function EnTête() {
  return (
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
                <div className="fr-header__navbar">
                  <button
                    aria-controls="modale-menu-principal"
                    aria-haspopup="menu"
                    className="fr-btn--menu fr-btn"
                    data-fr-opened="false"
                    id="bouton-menu-principal"
                    title="Menu"
                    type="button"
                  >
                    Menu
                  </button>
                </div>
              </div>
              <div className="fr-header__service">
                <Link
                  href="/"
                  title="Retour à l’accueil du site"
                >
                  <p className="fr-header__service-title">
                    PILOTE
                  </p>
                </Link>
                <p className="fr-header__service-tagline fr-hidden fr-unhidden-sm">
                  Piloter les politiques publiques par leurs impacts
                </p>
              </div>
            </div>
            <CompteUtilisateur />
          </div>
        </div>
      </div>
      <Navigation />
    </header>
  );
}
