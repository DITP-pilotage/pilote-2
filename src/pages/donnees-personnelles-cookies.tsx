import Head from 'next/head';
import { FunctionComponent } from 'react';
import DonneesPersonnellesCookies from '@/components/DonnéesPersonnellesCookies/DonneesPersonnellesCookies';

const NextPageCookies: FunctionComponent<{}> = () => {
  return (
    <>
      <Head>
        <title>
          Données personnelles et cookies
        </title>
      </Head>
      <DonneesPersonnellesCookies />
    </>
  );
};

export default NextPageCookies;
