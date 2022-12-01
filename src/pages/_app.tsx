/* eslint-disable react/jsx-props-no-spreading */
import '@gouvfr/dsfr/dist/core/core.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css';
import 'client/styles/app.scss';
import Layout from 'client/components/_commons/Layout/Layout';

import type { AppProps } from 'next/app';
import Script from 'next/script';

export default function MonApplication({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script
        src="js/dsfr/dsfr.module.min.js"
        type='module'
      />
      <Script
        noModule
        src="js/dsfr/dsfr.nomodule.min.js"
      />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}
