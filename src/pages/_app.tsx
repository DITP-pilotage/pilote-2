/* eslint-disable react/jsx-props-no-spreading */
import '@gouvfr/dsfr/dist/core/core.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css';

import type { AppProps } from 'next/app';
import Script from 'next/script';

export default function App({ Component, pageProps }: AppProps) {
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
      <Component {...pageProps} />
    </>
  );
}
