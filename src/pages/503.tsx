import Head from 'next/head';
import Erreur503 from '@/components/Erreur/Erreur503';

export default function Erreur503Personnalisée() {
  return (
    <>
      <Head>
        <title>
          Application indisponible - PILOTE
        </title>
      </Head>
      <Erreur503 />
    </>
  );
}
