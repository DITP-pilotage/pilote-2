import '@gouvfr/dsfr/dist/component/navigation/navigation.min.css';
import '@gouvfr/dsfr/dist/component/button/button.min.css';
import '@gouvfr/dsfr/dist/component/modal/modal.min.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Utilisateur from '@/components/_commons/MiseEnPage/EnTête/Utilisateur/Utilisateur';

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
    nom: 'Suivi de l’activité',
    lien: '/activite',
  },
  {
    nom: 'Nouveautés',
    lien: '/nouveautes',
  },
  {
    nom: 'Centre d\'aide',
    lien: '/aide',
  },
];

export default function Navigation() {
  const urlActuelle = useRouter().pathname;

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
        <div className="fr-header__menu-links">
          <Utilisateur />
        </div>
        <nav
          aria-label="Menu principal"
          className="fr-nav"
          id="navigation-menu-principal"
          role="navigation"
        >
          <ul className="fr-nav__list">
            {
              pages.map(page => (
                <li
                  className="fr-nav__item"
                  key={page.lien}
                >
                  <Link
                    aria-current={page.lien === urlActuelle ? 'true' : undefined}
                    className="fr-nav__link"
                    href={page.lien}
                    onClick={fermerLaModaleDuMenu}
                  >
                    {page.nom}
                  </Link>
                </li>
              ))
            }
          </ul>
        </nav>
      </div>
    </div>
  );
}
