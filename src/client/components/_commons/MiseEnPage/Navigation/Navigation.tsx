import '@gouvfr/dsfr/dist/component/navigation/navigation.min.css';
import '@gouvfr/dsfr/dist/component/button/button.min.css';
import '@gouvfr/dsfr/dist/component/modal/modal.min.css';
import '@gouvfr/dsfr/dist/component/notice/notice.min.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';

import { FunctionComponent } from 'react';
import Utilisateur from '@/components/_commons/MiseEnPage/EnTête/Utilisateur/Utilisateur';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import MenuItemGestionContenu from '@/components/_commons/MiseEnPage/Navigation/MenuItemGestionContenu';
import api from '@/server/infrastructure/api/trpc/api';
import { getFiltresActifs } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import { récupérerUnCookie } from '@/client/utils/cookies';
import { getQueryParamString } from '@/client/utils/getQueryParamString';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import IcôneEmail from '@/components/_commons/IcôneEmail/IcôneEmail';
import { derniereVersionNouveaute } from '../../../../../../public/nouveautés/ParametrageNouveautés';

const fermerLaModaleDuMenu = () => {
  if (typeof window.dsfr === 'function') {
    window.dsfr(document.querySelector<HTMLElement>('#modale-menu-principal'))?.modal?.conceal();
  }
};
const estAutoriséAParcourirSiIndisponible = (session: Session | null) => session?.profil === ProfilEnum.DITP_ADMIN;

function estAdministrateur(session: Session | null) {
  return session?.profil === ProfilEnum.DITP_ADMIN;
}

const estAutoriséAAccéderALaGestionDesComptes = (session: Session | null) => {
  if (!session) {
    return false;
  }
  const habilitations = new Habilitation(session.habilitations);
  return habilitations.peutCréerEtModifierUnUtilisateur();
};

const estAdministrateurOuPilotage = (session: Session) => {
  return [ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE].includes(session?.profil);
};

const useNavigation = () => {
  const { data: applicationEstDisponible } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE' });
  const { data: suiviCompletudeEstDisponible } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_SUIVI_COMPLETUDE' });

  return {
    vérifierValeurApplicationEstIndisponible: applicationEstDisponible,
    vérifierSuiviCompletudeEstDisponibleEstIndisponible: suiviCompletudeEstDisponible,
  };
};

const Navigation: FunctionComponent<{}> = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const urlActuelle = router.pathname;

  const {
    vérifierValeurApplicationEstIndisponible,
    vérifierSuiviCompletudeEstDisponibleEstIndisponible,
  } = useNavigation();

  if (vérifierValeurApplicationEstIndisponible && !estAutoriséAParcourirSiIndisponible(session) && urlActuelle !== '/503') {
    router.push('/503');
  }

  const filtresActifs = getFiltresActifs();

  const territoireCodeURL = router.query.territoireCode as string | undefined;

  const territoireCodeStore = Boolean(filtresActifs?.territoireCode) ?
    filtresActifs.territoireCode :
    (session?.habilitations.lecture.territoires.includes('NAT-FR') ? 'NAT-FR' : session?.habilitations.lecture.territoires[0]);
  const territoireCode = territoireCodeURL ?? territoireCodeStore;

  const queryParamString = getQueryParamString(filtresActifs, new Set(['territoireCode']));

  const aConsulteLaDerniereNouveaute = récupérerUnCookie('derniereVersionNouveauteConsulte') === derniereVersionNouveaute;

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
    {
      nom: 'Suivi de la complétude',
      lien: 'https://copilot-metabase.osc-secnum-fr1.scalingo.io/dashboard/39-tableau-de-bord-de-conformite-pilote',
      matcher: '/suivicompletude',
      accessible: vérifierSuiviCompletudeEstDisponibleEstIndisponible && estAdministrateurOuPilotage(session!),
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
          <ul>
            <li className='fr-mr-md-2w'>
              <button
                className='fr-btn fr-text--sm fr-py-0 fr-pr-1w fr-pl-0'
                type='button'
              >
                <IcôneEmail className='fr-mr-2v fr-text-title--blue-france' />
                <Link
                  className='font-normal'
                  href='mailto:pilote.ditp@modernisation.gouv.fr'
                  title="Contacter l'équipe PILOTE"
                >
                  Contacter l'équipe PILOTE
                </Link>
              </button>
            </li>
            <li>
              <Utilisateur />
            </li>
          </ul>
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
                        className='fr-nav__link relative'
                        href={page.lien}
                        onClick={fermerLaModaleDuMenu}
                        target={page.target}
                      >
                        {page.nom}
                        {
                          page.matcher === '/nouveautes' && !aConsulteLaDerniereNouveaute ? (
                            <span className='fr-text-red fr-pl-1v absolute fr-top-1v'>
                              ●
                            </span>
                          ) : null
                        }
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
};

export default Navigation;
