import Head from 'next/head';
import DonneesPersonnellesCookies from '@/components/DonnéesPersonnellesCookies/DonneesPersonnellesCookies';

const NextPageCookies = () => {
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
