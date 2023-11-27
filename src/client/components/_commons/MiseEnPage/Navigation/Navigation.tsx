import '@gouvfr/dsfr/dist/component/navigation/navigation.min.css';
import '@gouvfr/dsfr/dist/component/button/button.min.css';
import '@gouvfr/dsfr/dist/component/modal/modal.min.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Utilisateur from '@/components/_commons/MiseEnPage/EnTête/Utilisateur/Utilisateur';

const fermerLaModaleDuMenu = () => {
  if (typeof window.dsfr === 'function') {
    window.dsfr(document.querySelector<HTMLElement>('#modale-menu-principal'))?.modal?.conceal();
  }
};

const vérifierBandeauEstActif = () => {
  return process.env.NEXT_PUBLIC_FF_BANDEAU_INDISPONIBILITE === 'true';
};

export default function Navigation() {
  const { data: session } = useSession();
  const urlActuelle = useRouter().pathname;

  const isBandeauActif = vérifierBandeauEstActif();

  const pages = [
    {
      nom: 'Accueil',
      lien: '/',
      accessible: true,
      target: '_self',
    },
    {
      nom: 'Gestion des comptes',
      lien: '/admin/utilisateurs',
      accessible: session?.profil === 'DITP_ADMIN',
      target: '_self',
    },
    /*{
      nom: 'Gestion des indicateurs',
      lien: '/admin/indicateurs',
      accessible: session?.profil === 'DITP_ADMIN',
      target: '_self',
    },*/
    {
      nom: 'Nouveautés',
      lien: '/nouveautes',
      accessible: true,
      target: '_self',
    },
    {
      nom: 'Centre d\'aide',
      lien: 'https://centre-aide-pilote-ditp.osc-fr1.scalingo.io/',
      accessible: true,
      target: '_blank',
    },
  ];

  return (
    <>
      <div
        aria-labelledby='bouton-menu-principal'
        className='fr-header__menu fr-modal'
        id='modale-menu-principal'
      >
        <div className='fr-container'>
          <button
            aria-controls='modale-menu-principal'
            className='fr-btn--close fr-btn'
            title='Fermer'
            type='button'
          >
            Fermer
          </button>
          <div className='fr-header__menu-links'>
            <Utilisateur />
          </div>
          <nav
            aria-label='Menu principal'
            className='fr-nav'
            id='navigation-menu-principal'
            role='navigation'
          >
            <ul className='fr-nav__list'>
              {
                pages.map(page => (
                  page.accessible &&
                    <li
                      className='fr-nav__item'
                      key={page.lien}
                    >
                      <Link
                        aria-current={page.lien === urlActuelle ? 'true' : undefined}
                        className='fr-nav__link'
                        href={page.lien}
                        onClick={fermerLaModaleDuMenu}
                        target={page.target}
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
      {
        isBandeauActif ? (
          <div className='fr-notice fr-notice--info'>
            <div className='fr-container'>
              <div className='fr-notice__body'>
                <p className='fr-notice__title'>
                  En raison d’une opération de maintenance, PILOTE sera totalement indisponible le mercredi 6 décembre de 9h à 12h. L&apos;import de données restera indisponible jusqu’au vendredi 8 décembre inclus. En cas de difficulté :
                  {' '}
                  <a href='mailto:support.ditp@modernisation.gouv.fr'>
                    support.ditp@modernisation.gouv.fr
                  </a>
                </p>
                <button
                  className='fr-btn--close fr-btn'
                  onClick={(event) => {
                    const notice = event.currentTarget?.parentNode?.parentNode?.parentNode;
                    notice?.parentNode?.removeChild(notice);
                  }}
                  title='Masquer le message'
                  type='button'
                >
                  Masquer le message
                </button>
              </div>
            </div>
          </div>
        ) : null
      }
    </>
  );
}
