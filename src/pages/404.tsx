import Head from 'next/head';
import { FunctionComponent } from 'react';
import Erreur404 from '@/components/Erreur/Erreur404';

const Erreur404Personnalisée: FunctionComponent<{}> = () => {
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
};

export default Erreur404Personnalisée;
