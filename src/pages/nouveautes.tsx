import Head from 'next/head';
import Nouveautés from '@/components/Nouveautés/Nouveautés';

export default function NextPageNouveautés() {
  return (
    <>
      <Head>
        <title>
          Nouveautés - PILOTE
        </title>
      </Head>
      <Nouveautés />
    </>
  );
}
