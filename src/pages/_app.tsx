/* eslint-disable react/jsx-props-no-spreading */
import '@gouvfr/dsfr/dist/core/core.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.min.css';
import '@/client/styles/app.scss';
import type { AppProps } from 'next/app';
import Script from 'next/script';
import { SessionProvider } from 'next-auth/react';
import MiseEnPage from '@/client/components/_commons/MiseEnPage/MiseEnPage';


export default function MonApplication({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <>
      <Script
        src="/js/dsfr/dsfr.module.min.js"
        type='module'
      />
      <Script
        noModule
        src="/js/dsfr/dsfr.nomodule.min.js"
      />
      <SessionProvider session={session} >
        <MiseEnPage>
          <Component {...pageProps} />
        </MiseEnPage>
      </SessionProvider>
    </>
  );
}
