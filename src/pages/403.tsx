import Head from 'next/head';
import { FunctionComponent } from 'react';
import Erreur404 from '@/components/Erreur/Erreur404';

const Erreur403Unauthorized: FunctionComponent<{}> = () => {
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
};

export default Erreur403Unauthorized;
