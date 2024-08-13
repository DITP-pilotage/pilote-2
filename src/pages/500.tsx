import Head from 'next/head';
import { FunctionComponent } from 'react';
import Erreur500 from '@/components/Erreur/Erreur500';

const Erreur500Personnalisée: FunctionComponent<{}> = () => {
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
};

export default Erreur500Personnalisée;
