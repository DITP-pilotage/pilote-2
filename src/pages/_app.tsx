import '@gouvfr/dsfr/dist/core/core.min.css';
import '@gouvfr/dsfr/dist/component/link/link.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-design/icons-design.min.css';
import '@/client/styles/app.scss';
import type { AppProps } from 'next/app';
import Script from 'next/script';
import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Head from 'next/head';
import { TRPCClientError } from '@trpc/client';
import init from '@socialgouv/matomo-next';
import MiseEnPage from '@/client/components/_commons/MiseEnPage/MiseEnPage';
import useDétecterLargeurDÉcran from '@/client/hooks/useDétecterLargeurDÉcran';
import api from '@/server/infrastructure/api/trpc/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof TRPCClientError && error?.data?.code === 'UNAUTHORIZED') {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

function MonApplication({ Component, pageProps }: AppProps) {
  useDétecterLargeurDÉcran();

  const matomoUrl = process.env.NEXT_PUBLIC_MATOMO_URL;
  const matomoSiteId = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;
  const estRecordAnalyticsActive = process.env.NEXT_PUBLIC_RECORD_ANALYTICS;

  useEffect(() => {
    if (estRecordAnalyticsActive === 'true') {
      init({ url: matomoUrl as string, siteId: matomoSiteId as string });
    }
  }, [estRecordAnalyticsActive, matomoSiteId, matomoUrl]);

  return (
    <>
      <Script
        src='/js/dsfr/dsfr.module.min.js'
        type='module'
      />
      <Script
        noModule
        src='/js/dsfr/dsfr.nomodule.min.js'
      />
      <Head>
        <title>
          Pilote - Chargement compte utilisateur
        </title>
        <link
          href='/favicon/apple-touch-icon.png'
          rel='apple-touch-icon'
        />
        <link
          href='/favicon/favicon.svg'
          rel='icon'
          type='image/svg+xml'
        />
        <link
          href='/favicon/favicon.ico'
          rel='shortcut icon'
          type='image/x-icon'
        />
        <link
          crossOrigin='use-credentials'
          href='/favicon/manifest.webmanifest'
          rel='manifest'
        />
      </Head>
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={pageProps.session}>
          <MiseEnPage afficherLeLoader={false}>
            <Component {...pageProps} />
          </MiseEnPage>
        </SessionProvider>
      </QueryClientProvider>
    </>
  );
}

export default api.withTRPC(MonApplication);
