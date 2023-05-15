import Head from 'next/head';
import Erreur500 from '@/components/Erreur/Erreur500';

export default function Erreur500Personnalisée() {
  return (
    <>
      <Head>
        <title>
          Erreur inattendue - PILOTE
        </title>
      </Head>
      <Erreur500 />
    </>
  );
}
