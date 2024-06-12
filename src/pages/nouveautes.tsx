import Head from 'next/head';
import { GetServerSideProps } from 'next';
import Nouveautés from '@/components/Nouveautés/Nouveautés';
import { derniereVersionNouveaute } from '../../public/nouveautés/ParametrageNouveautés';

export const getServerSideProps: GetServerSideProps<{}> = async ({ res }) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  res.setHeader('Set-Cookie', `derniereVersionNouveauteConsulte=${derniereVersionNouveaute}; path=/; samesite=lax; expires="${date.toUTCString()}";`);

  return {
    props: {},
  };
};


export default function NextPageNouveautés() {

  return (
    <>
      <Head>
        <title>
          Nouveautés : Service bientôt disponible ! - PILOTE
        </title>
      </Head>
      <Nouveautés />
    </>
  );
}
