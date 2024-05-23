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
import api from '@/server/infrastructure/api/trpc/api';
import { getFiltresActifs } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';

const fermerLaModaleDuMenu = () => {
  if (typeof window.dsfr === 'function') {
    window.dsfr(document.querySelector<HTMLElement>('#modale-menu-principal'))?.modal?.conceal();
  }
};
const estAutoriséAParcourirSiIndisponible = (session: Session | null) => session?.profil === 'DITP_ADMIN';

function estAdministrateur(session: Session | null) {
  return session?.profil === 'DITP_ADMIN';
}

const estAutoriséAAccéderALaGestionDesComptes = (session: Session | null) => {
  if (!session) {
    return false;
  }
  const habilitations = new Habilitation(session.habilitations);
  return habilitations.peutCréerEtModifierUnUtilisateur();
};

const useNavigation = () => {
  const { data: applicationEstDisponible } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE' });

  return {
    vérifierValeurApplicationEstIndisponible: applicationEstDisponible,
  };
};

export default function Navigation() {
  const { data: session } = useSession();
  const router = useRouter();
  const urlActuelle = router.pathname;

  const { vérifierValeurApplicationEstIndisponible } = useNavigation();

  if (vérifierValeurApplicationEstIndisponible && !estAutoriséAParcourirSiIndisponible(session) && urlActuelle !== '/503') {
    router.push('/503');
  }

  const filtresActifs = getFiltresActifs();

  const territoireCodeURL = router.query.territoireCode as string | undefined;

  // Cas où le code territoire n'est pas dans l'url (page chantier), on utilise le store.
  // A supprimer au moment du refacto de la page chantier.
  const territoireCodeStore = territoireSélectionnéTerritoiresStore()?.code ?? (session?.habilitations.lecture.territoires.includes('NAT-FR') ? 'NAT-FR' : session?.habilitations.lecture.territoires[0]);
  const territoireCode = territoireCodeURL ?? territoireCodeStore;

  const queryParamString = new URLSearchParams(Object.entries(filtresActifs).map(([key, value]) => (value && String(value).length > 0 ? [key, String(value)] : [])).filter(value => value.length > 0)).toString();

  const pages = [
    {
      nom: 'Accueil',
      lien: `/accueil/chantier/${territoireCode}${queryParamString.length > 0 ? `?${queryParamString}` : ''}`,
      matcher: '/accueil/chantier/[territoireCode]',
      accessible: true,
      prefetch: true,
      target: '_self',
    },
    {
      nom: 'Gestion des comptes',
      lien: '/admin/utilisateurs',
      matcher: '/admin/utilisateurs',
      accessible: estAutoriséAAccéderALaGestionDesComptes(session),
      prefetch: false,
      target: '_self',
    },
    {
      nom: 'Nouveautés',
      lien: '/nouveautes',
      matcher: '/nouveautes',
      accessible: true,
      prefetch: false,
      target: '_self',
    },
    {
      nom: 'Centre d\'aide',
      lien: '/centreaide',
      matcher: '/centreaide',
      accessible: true,
      prefetch: false,
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
            !vérifierValeurApplicationEstIndisponible || (vérifierValeurApplicationEstIndisponible && estAutoriséAParcourirSiIndisponible(session)) ? (
              <ul className='fr-nav__list'>
                {
                  pages.map(page => (
                    page.accessible &&
                    <li
                      className='fr-nav__item'
                      key={page.lien}
                    >
                      <Link
                        aria-current={page.matcher === urlActuelle ? 'true' : undefined}
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
