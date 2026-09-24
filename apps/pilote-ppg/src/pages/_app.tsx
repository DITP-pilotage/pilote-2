import "@gouvfr/dsfr/dist/core/core.min.css";
import "@gouvfr/dsfr/dist/component/link/link.min.css";
import "@gouvfr/dsfr/dist/component/connect/connect.min.css";
import "@/client/styles/app.scss";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";
import { useEffect, useState } from "react";
import Head from "next/head";
import { trackPagesRouter } from "@socialgouv/matomo-next";
import Router from "next/router";
import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/pages";
import MiseEnPage from "@/client/components/_commons/MiseEnPage/MiseEnPage";
import useDétecterLargeurDÉcran from "@/client/hooks/useDétecterLargeurDÉcran";
import api from "@/server/infrastructure/api/trpc/api";
import { Tooltip } from "@/components/shared/Tooltip";

const DELAI_AVANT_APPARITION_DU_LOADER_EN_MS = 500;

function MonApplication({ Component, pageProps }: AppProps) {
  useDétecterLargeurDÉcran();

  const [afficherLeLoader, setAfficherLeLoader] = useState(false);
  const [pageEnCoursDeChargement, setPageEnCoursDeChargement] = useState(false);

  const débutChargement = () => {
    setPageEnCoursDeChargement(true);
  };
  const finChargement = () => {
    setPageEnCoursDeChargement(false);
  };

  useEffect(() => {
    void import("@gouvfr/dsfr/dist/dsfr.module.min.js");
  }, []);

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
      trackPagesRouter({
        url: matomoUrl as string,
        siteId: matomoSiteId as string,
        enableHeatmapSessionRecording: true,
      });
    }
  }, [estRecordAnalyticsActive, matomoSiteId, matomoUrl]);

  return (
    <NuqsAdapter>
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
      <ReactQueryDevtools initialIsOpen={false} />
      <Tooltip.Provider>
        <SessionProvider session={pageProps.session}>
          <MiseEnPage afficherLeLoader={afficherLeLoader}>
            <Component {...pageProps} />
            <Toaster />
          </MiseEnPage>
        </SessionProvider>
      </Tooltip.Provider>
    </NuqsAdapter>
  );
}

export default api.withTRPC(MonApplication);
