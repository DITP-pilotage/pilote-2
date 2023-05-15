import Head from 'next/head';
import Erreur404 from '@/components/Erreur/Erreur404';

export default function Erreur404Personnalisée() {
  return (
    <>
      <Head>
        <title>
          Page non trouvée - PILOTE
        </title>
      </Head>
      <Erreur404 />
    </>
  );
}
