import Head from 'next/head';
import { FunctionComponent } from 'react';
import Erreur503 from '@/components/Erreur/Erreur503';

const Erreur503Personnalisée: FunctionComponent<{}> = () => {
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
};

export default Erreur503Personnalisée;
