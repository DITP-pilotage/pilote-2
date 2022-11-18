import '@gouvfr/dsfr/dist/component/navigation/navigation.min.css';
import '@gouvfr/dsfr/dist/component/button/button.min.css';
import '@gouvfr/dsfr/dist/component/modal/modal.min.css';

import Link from 'next/link';

const fermerLaModaleDuMenu = () => {
  if (typeof window.dsfr === 'function') {
    window.dsfr(document.querySelector<HTMLElement>('#modale-menu-principal'))?.modal?.conceal();
  }
};

const pages = [
  {
    nom: 'Accueil',
    lien: '/',
  },
  {
    nom: 'Chantiers',
    lien: '/chantiers',
  },
];

export default function Navigation() {

  return (
    <div
      aria-labelledby="bouton-menu-principal"
      className="fr-header__menu fr-modal"
      id="modale-menu-principal"
    >
      <div className="fr-container">
        <button
          aria-controls="modale-menu-principal"
          className="fr-btn--close fr-btn"
          title="Fermer"
          type="button"
        >
          Fermer
        </button>
        <div className="fr-header__menu-links" />
        <nav
          aria-label="Menu principal"
          className="fr-nav"
          id="navigation-menu-principal"
          role="navigation"
        >
          <ul className="fr-nav__list">
            {pages.map((page) => (
              <li
                className="fr-nav__item"
                key={page.lien}
              >
                <Link
                  className="fr-nav__link"
                  href={page.lien}
                  onClick={fermerLaModaleDuMenu}
                >
                  {page.nom}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}