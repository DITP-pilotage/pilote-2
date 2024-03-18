import Head from 'next/head';
import Erreur404 from '@/components/Erreur/Erreur404';

export default function Erreur403Unauthorized() {
  return (
    <>
      <Head>
        <title>
          Une erreur de droit est survenue - Page non autorisé - PILOTE
        </title>
      </Head>
      <Erreur404 />
    </>
  );
}
