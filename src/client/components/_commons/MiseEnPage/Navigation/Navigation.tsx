import '@gouvfr/dsfr/dist/component/navigation/navigation.min.css';
import '@gouvfr/dsfr/dist/component/button/button.min.css';
import '@gouvfr/dsfr/dist/component/modal/modal.min.css';
import '@gouvfr/dsfr/dist/component/notice/notice.min.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import Utilisateur from '@/components/_commons/MiseEnPage/EnTête/Utilisateur/Utilisateur';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { MenuItemGestionContenu } from '@/components/_commons/MiseEnPage/Navigation/MenuItemGestionContenu';

const fermerLaModaleDuMenu = () => {
  if (typeof window.dsfr === 'function') {
    window.dsfr(document.querySelector<HTMLElement>('#modale-menu-principal'))?.modal?.conceal();
  }
};
const vérifierValeurApplicationEstIndisponible = () => {
  return process.env.NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE === 'true';
};

const estAutoriséAParcourirSiIndisponible = (session: Session | null) => session?.profil === 'DITP_ADMIN';

function estAdministrateur(session: Session | null) {
  return session?.profil === 'DITP_ADMIN';
}

const estAutoriséAAccéderALaGestionDesComptes = (session: Session | null) => {
  if (!!!session) {
    return false;
  }
  const habilitations = new Habilitation(session.habilitations);
  return habilitations.peutCréerEtModifierUnUtilisateur();
};

export default function Navigation() {
  const { data: session } = useSession();
  const router = useRouter();
  const urlActuelle = router.pathname;


  if (vérifierValeurApplicationEstIndisponible() && !estAutoriséAParcourirSiIndisponible(session) && urlActuelle !== '/503') {
    router.push('/503');
  }

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
      accessible: estAutoriséAAccéderALaGestionDesComptes(session),
      target: '_self',
    },
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
          {
            !vérifierValeurApplicationEstIndisponible() || (vérifierValeurApplicationEstIndisponible() && estAutoriséAParcourirSiIndisponible(session)) ? (
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
                { 
                  estAdministrateur(session) ? (
                    <MenuItemGestionContenu urlActuelle={urlActuelle} />
                  ) : null
                }
              </ul>
            ) : null
          }
        </nav>
      </div>
    </div>
  );
}
