import { signOut, useSession, signIn } from 'next-auth/react';
import { useState } from 'react';
import UtilisateurStyled from './Utilisateur.styled';

export default function Utilisateur() {
  const [estDéplié, setEstDéplié] = useState<boolean>(false);
  const { data: session } = useSession();

  return (
    <UtilisateurStyled
      className='fr-grid-row'
      estDéplié={estDéplié}
    >
      <span className='fr-col-12'>
        {
          session?.user?.email ?
            <button
              className='fr-text--sm fr-p-0'
              onClick={() => setEstDéplié(!estDéplié)}
              type='button'
            >
              <i className='fr-icon-account-line fr-mr-1v' />
              {session?.user?.email}
              <i className='fr-icon-arrow-right-s-line' />
            </button>
            :
            <button
              onClick={() => signIn('keycloak')}
              type='button'
            >
              <i className='fr-icon-account-line fr-mr-1v' />
              {' '}
              Se connecter
            </button>
        }
      </span>
      {
        !!estDéplié &&
        <span className='fr-col-12'>
          <button
            className='fr-p-0'
            onClick={() => signOut()}
            type='button'
          >
            Déconnexion
          </button>
        </span>
      }
    </UtilisateurStyled>
  );
}
