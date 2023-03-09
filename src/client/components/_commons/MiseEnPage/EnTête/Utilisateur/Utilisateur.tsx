import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import UtilisateurStyled from './Utilisateur.styled';

export default function Utilisateur() {
  const [estDéplié, setEstDéplié] = useState<boolean>(false);
  const { data: session, status } = useSession();

  if (status === 'loading') return null;

  return (
    <UtilisateurStyled
      className='fr-grid-row'
      estDéplié={estDéplié}
    >
      <span className='fr-col-12'>
        <button
          className="fr-text--sm fr-p-0"
          onClick={() => setEstDéplié(!estDéplié)}
          type="button"
        >
          <i className='fr-icon-account-line fr-mr-1v' />
          {session?.user?.email}
          <i className='fr-icon-arrow-right-s-line' />
        </button>
      </span>
      {
        !!estDéplié &&
        <span className='fr-col-12'>
          <button
            className='fr-p-0'
            onClick={() => signOut()}
            type="button"
          >
            Déconnexion
          </button>
        </span>
      }
    </UtilisateurStyled>
  );
}
