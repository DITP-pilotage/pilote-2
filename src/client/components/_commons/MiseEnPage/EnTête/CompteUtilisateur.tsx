import { signIn, signOut, useSession } from 'next-auth/react';
import { Session } from 'next-auth';

export default function Component() {
  const { data: session, status } = useSession();
  const mySession = session as Session & { error: String }; // TODO définir le type au même endroit qu'on ajoute tokenExp
  
  if (session) {
    return (
      <div>
        <span>
          <span>
            Connecté en tant que&nbsp;
          </span>
          <span>
            {session.user?.email}
          </span>
          <span>
            ,&nbsp;
          </span>
          <span>
            {mySession?.error }
          </span>
        </span>
        <br />
        <button
          onClick={() => signOut()}
          type="button"
        >
          Déconnexion
        </button>
      </div>
    );
  } else if (status == 'loading') {
    return (
      <div>
        ...
      </div>
    );
  } else {
    return (
      <div>
        Not signed in
        <br />
        <button
          onClick={() => signIn('keycloak')}
          type="button"
        >
          Sign in
        </button>
      </div>
    );
  }
}
