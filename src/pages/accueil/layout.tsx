import Head from 'next/head';
import { FunctionComponent, PropsWithChildren } from 'react';

const NextAccueilLayout : FunctionComponent<PropsWithChildren> = ({ children }) => {

  return (
    <>
      <Head>
        <title>
          PILOTE - Piloter l’action publique par les résultats
        </title>
      </Head>
      <div className='flex'>
        { children }
      </div>
    </>
  );
};

export default NextAccueilLayout;
