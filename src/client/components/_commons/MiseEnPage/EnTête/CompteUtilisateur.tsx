import { useSession, signIn, signOut } from 'next-auth/react';

export default function Component() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div>
        Signed in as
        {' '}
        {session.user?.email}
        , 
        {' '}
        {session.tokenExp}
        {' '}
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
