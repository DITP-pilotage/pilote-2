import { useSession, signIn, signOut } from 'next-auth/react';
import { Session } from 'next-auth';
import { useEffect } from "react";

export default function Component() {
  const { data: session } = useSession();
  
  const mySession = session as Session & { error: String }; // TODO définir le type au même endroit qu'on ajoute tokenExp
  if (session) {
    return (
      <div>
        <span>
          <span>
            Signed in as&nbsp;
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
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div>
      Not signed in 
      {' '}
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
