import "@gouvfr/dsfr/dist/core/core.min.css";
import "@gouvfr/dsfr/dist/component/link/link.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-design/icons-design.min.css";
import "@/client/styles/app.scss";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Head from "next/head";
import { TRPCClientError } from "@trpc/client";
import init from "@socialgouv/matomo-next";
import Router from "next/router";
import MiseEnPage from "@/client/components/_commons/MiseEnPage/MiseEnPage";
import useDétecterLargeurDÉcran from "@/client/hooks/useDétecterLargeurDÉcran";
import api from "@/server/infrastructure/api/trpc/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (
          error instanceof TRPCClientError &&
          error?.data?.code === "UNAUTHORIZED"
        ) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const DELAI_AVANT_APPARITION_DU_LOADER_EN_MS = 500;

// Props spécifiques pour l'AppComponent incluant emotionCache
interface MyAppProps extends AppProps {
  nonce?: string;
}

type WindowAvecNonce = Window & { __nonce?: string };

function MonApplication({ Component, pageProps, nonce: appNonce }: MyAppProps) {
  useDétecterLargeurDÉcran();

  const [afficherLeLoader, setAfficherLeLoader] = useState(false);
  const [pageEnCoursDeChargement, setPageEnCoursDeChargement] = useState(false);

  // Utiliser le nonce passé par les props (côté serveur) ou le récupérer depuis window (côté client)
  const nonce =
    appNonce ||
    (typeof window !== "undefined"
      ? (window as WindowAvecNonce).__nonce || ""
      : "");

  const débutChargement = () => {
    setPageEnCoursDeChargement(true);
  };
  const finChargement = () => {
    setPageEnCoursDeChargement(false);
  };

  useEffect(() => {
    Router.events.on("routeChangeStart", débutChargement);
    Router.events.on("routeChangeComplete", finChargement);
    Router.events.on("routeChangeError", finChargement);
    return () => {
      Router.events.off("routeChangeStart", débutChargement);
      Router.events.off("routeChangeComplete", finChargement);
      Router.events.off("routeChangeError", finChargement);
    };
  }, []);

  useEffect(() => {
    let timer = setTimeout(() => {});

    if (pageEnCoursDeChargement)
      timer = setTimeout(
        () => setAfficherLeLoader(true),
        DELAI_AVANT_APPARITION_DU_LOADER_EN_MS,
      );
    else {
      clearTimeout(timer);
      setAfficherLeLoader(false);
    }

    return () => clearTimeout(timer);
  }, [pageEnCoursDeChargement]);

  const matomoUrl = process.env.NEXT_PUBLIC_MATOMO_URL;
  const matomoSiteId = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;
  const estRecordAnalyticsActive = process.env.NEXT_PUBLIC_RECORD_ANALYTICS;

  useEffect(() => {
    if (estRecordAnalyticsActive === "true") {
      init({ url: matomoUrl as string, siteId: matomoSiteId as string });
    }
  }, [estRecordAnalyticsActive, matomoSiteId, matomoUrl]);

  return (
    <>
      <Script nonce={nonce} src="/js/dsfr/dsfr.module.min.js" type="module" />
      <Script noModule nonce={nonce} src="/js/dsfr/dsfr.nomodule.min.js" />
      <Head>
        <title>Pilote - Chargement compte utilisateur</title>
        <link href="/favicon/apple-touch-icon.png" rel="apple-touch-icon" />
        <link href="/favicon/favicon.svg" rel="icon" type="image/svg+xml" />
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
