import MiseEnPageProps from './MiseEnPage.interface';
import EnTête from './EnTête/EnTête';
import PiedDePage from './PiedDePage/PiedDePage';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Session } from 'next-auth';
import { useEffect } from "react";

export default function MiseEnPage({ children }: MiseEnPageProps) {
  const { data: session } = useSession();
  const mySession = session as Session & { error: String }; // TODO définir le type au même endroit qu'on ajoute tokenExp

  useEffect(() => {
    
    if (mySession?.error === "RefreshAccessTokenError") {
      signIn('keycloak'); // Force sign in to hopefully resolve error
    }
  }, [mySession]);

  return (
    <>
      <EnTête />
      {children}
      <PiedDePage />
    </>
  );
}
