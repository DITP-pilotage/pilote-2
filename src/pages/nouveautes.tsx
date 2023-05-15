import Head from 'next/head';
import Nouveautés from '@/components/Nouveautés/Nouveautés';

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
