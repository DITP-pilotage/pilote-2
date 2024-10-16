import '@gouvfr/dsfr/dist/component/header/header.min.css';
import '@gouvfr/dsfr/dist/component/logo/logo.min.css';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FunctionComponent } from 'react';
import Navigation from '@/components/_commons/MiseEnPage/Navigation/Navigation';
import Utilisateur from '@/components/_commons/MiseEnPage/EnTête/Utilisateur/Utilisateur';
import BandeauInformation from '@/components/_commons/BandeauInformation/BandeauInformation';
import api from '@/server/infrastructure/api/trpc/api';
import IcôneEmail from '@/components/_commons/IcôneEmail/IcôneEmail';

const useEntete = () => {
  const { data: messageInformation } = api.gestionContenu.récupérerMessageInformation.useQuery();
  return {
    messageInformation,
  };
};

const EnTête: FunctionComponent<{}> = () => {
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
                <ul className='flex align-center'>
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
            </div>
          </div>
        </div>
      </div>
      {session?.user ? <Navigation /> : null}
      {
        isBandeauActif ? (
          <BandeauInformation bandeauType={bandeauType}>
            {bandeauTexte}
          </BandeauInformation>
        ) : null
      }
    </header>
  );
};

export default EnTête;
