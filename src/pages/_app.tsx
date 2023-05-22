/* eslint-disable react/jsx-props-no-spreading */
import '@gouvfr/dsfr/dist/core/core.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-design/icons-design.min.css';
import '@/client/styles/app.scss';
import type { AppProps } from 'next/app';
import Script from 'next/script';
import { SessionProvider } from 'next-auth/react';
import { Router } from 'next/router';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Head from 'next/head';
import { TRPCClientError } from '@trpc/client';
import MiseEnPage from '@/client/components/_commons/MiseEnPage/MiseEnPage';
import useDétecterVueMobile from '@/client/hooks/useDétecterVueMobile';
import api from '@/server/infrastructure/api/trpc/api';

const DELAI_AVANT_APPARITION_DU_LOADER_EN_MS = 500;
const queryClient = new QueryClient({
  defaultOptions: { 
    queries: { 
      refetchOnWindowFocus: false, 
      retry: (failureCount, error) => {
        if (error instanceof TRPCClientError && error?.data.code === 'UNAUTHORIZED') {
          return false;
        }
        return failureCount < 3;
      },
    }, 
  }, 
});

function MonApplication({ Component, pageProps }: AppProps) {
  useDétecterVueMobile();
  const [afficherLeLoader, setAfficherLeLoader] = useState(false);
  const [pageEnCoursDeChargement, setPageEnCoursDeChargement] = useState(false);

  const débutChargement = () => {
    setPageEnCoursDeChargement(true);
  };
  const finChargement = () => {
    setPageEnCoursDeChargement(false);
  };

  useEffect(() => {
    Router.events.on('routeChangeStart', débutChargement);
    Router.events.on('routeChangeComplete', finChargement);
    Router.events.on('routeChangeError', finChargement);

    return () => {
      Router.events.off('routeChangeStart', débutChargement);
      Router.events.off('routeChangeComplete', finChargement);
      Router.events.off('routeChangeError', finChargement);
    };
  }, []);

  useEffect(() => {
    let timer = setTimeout(() => {});

    if (pageEnCoursDeChargement)
      timer = setTimeout(() => setAfficherLeLoader(true), DELAI_AVANT_APPARITION_DU_LOADER_EN_MS);
    else {
      clearTimeout(timer);
      setAfficherLeLoader(false);
    }

    return () => clearTimeout(timer);
  }, [pageEnCoursDeChargement]);

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
      <Head>
        <link
          href="/favicon/apple-touch-icon.png"
          rel="apple-touch-icon"
        />
        <link
          href="/favicon/favicon.svg"
          rel="icon"
          type="image/svg+xml"
        />
        <link
          href="/favicon/favicon.ico"
          rel="shortcut icon"
          type="image/x-icon"
        />
        <link
          crossOrigin="use-credentials"
          href="/favicon/manifest.webmanifest"
          rel="manifest"
        />
      </Head>
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={pageProps.session}>
          <MiseEnPage afficherLeLoader={afficherLeLoader}>
            <Component {...pageProps} />
          </MiseEnPage>
        </SessionProvider>
      </QueryClientProvider>
    </>
  );
}

export default api.withTRPC(MonApplication);
