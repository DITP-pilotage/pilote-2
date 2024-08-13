import Head from 'next/head';
import { FunctionComponent } from 'react';
import MentionsLegales from '@/components/MentionsLegales/MentionsLegales';

const NextPageMentionsLegales: FunctionComponent<{}> = () => {
  return (
    <>
      <Head>
        <title>
          Mentions légales
        </title>
      </Head>
      <MentionsLegales />
    </>
  );
};

export default NextPageMentionsLegales;
