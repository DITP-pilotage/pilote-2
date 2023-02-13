/* eslint-disable react/jsx-props-no-spreading */
import '@gouvfr/dsfr/dist/core/core.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css';
import '@/client/styles/app.scss';
import type { AppProps } from 'next/app';
import Script from 'next/script';
import MiseEnPage from '@/client/components/_commons/MiseEnPage/MiseEnPage';
import AppContext, { defaultValue as defaultAppContextValue } from '@/client/contexts/AppContext/AppContext';

export default function MonApplication({ Component, pageProps }: AppProps) {
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
      <AppContext.Provider value={defaultAppContextValue}>
        <MiseEnPage>
          <Component {...pageProps} />
        </MiseEnPage>
      </AppContext.Provider>
    </>
  );
}
