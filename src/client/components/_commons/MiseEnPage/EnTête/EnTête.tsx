import '@gouvfr/dsfr/dist/component/header/header.min.css';
import '@gouvfr/dsfr/dist/component/logo/logo.min.css';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Navigation from '@/components/_commons/MiseEnPage/Navigation/Navigation';
import Utilisateur from '@/components/_commons/MiseEnPage/EnTête/Utilisateur/Utilisateur';
import { BandeauInformation } from '@/components/_commons/BandeauInformation';
import api from '@/server/infrastructure/api/trpc/api';

const useEntete = () => {
  const { data: messageInformation } = api.gestionContenu.récupérerMessageInformation.useQuery();
  return {
    messageInformation,
  };
};

export default function EnTête() {
  const { data: session } = useSession();
  const { messageInformation } = useEntete();

  const isBandeauActif = messageInformation?.isBandeauActif || false;
  const bandeauTexte = messageInformation?.bandeauTexte || 'Des opérations de maintenance sont en cours et peuvent perturber le fonctionnement normal de PILOTE. En cas de difficultés : support.ditp@modernisation.gouv.fr';
  const bandeauType = messageInformation?.bandeauType || 'WARNING';

  return (
    <header
      className='fr-header'
      role='banner'
    >
      <div className='fr-header__body'>
        <div className='fr-container'>
          <div className='fr-header__body-row'>
            <div className='fr-header__brand fr-enlarge-link'>
              <div className='fr-header__brand-top'>
                <div className='fr-header__logo'>
                  <p className='fr-logo'>
                    Gouvernement
                  </p>
                </div>
                {
                  !!session &&
                  <div className='fr-header__navbar'>
                    <button
                      aria-controls='modale-menu-principal'
                      aria-haspopup='menu'
                      className='fr-btn--menu fr-btn'
                      data-fr-opened='false'
                      id='bouton-menu-principal'
                      title='Menu'
                      type='button'
                    >
                      Menu
                    </button>
                  </div>
                }
              </div>
              <div className='fr-header__service'>
                <Link
                  href='/'
                  title='Retour à l’accueil du site'
                >
                  <p className='fr-header__service-title'>
                    PILOTE
                  </p>
                </Link>
                <p className='fr-header__service-tagline fr-text--sm'>
                  Piloter l’action publique par les résultats
                </p>
              </div>
            </div>
            <div className='fr-header__tools'>
              <div className='fr-header__tools-links'>
                <ul>
                  <li>
                    <Utilisateur />
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {session?.user ? <Navigation /> : null}
      {
        isBandeauActif ? (
          <BandeauInformation bandeauType={bandeauType}>
            { bandeauTexte }
          </BandeauInformation>
        ) : null
      }
    </header>
  );
}
