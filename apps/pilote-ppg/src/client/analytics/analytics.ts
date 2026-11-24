import { z } from "zod";
import {
  createBrowserAnalytics,
  createMutedAnalytics,
  type Analytics,
  type InactiveAnalyticsReason,
} from "@/client/analytics/browser";
import { loadDimensionSlots } from "@/client/analytics/loadDimensionSlots";
import {
  ANALYTICS_ENVIRONNEMENTS,
  type AnalyticsEnvironnement,
} from "@/client/analytics/schema";

// Au-delà, les envois retenus partent sans dimensions : l'analytics n'attend pas le serveur.
const DIMENSIONS_TIMEOUT_MS = 3000;

const environnementSchema = z.enum(ANALYTICS_ENVIRONNEMENTS);

export const parseEnvironnement = (
  raw: string | undefined,
): AnalyticsEnvironnement | undefined => {
  const result = environnementSchema.safeParse(raw);
  return result.success ? result.data : undefined;
};

const respectDoNotTrack = (): boolean =>
  navigator.doNotTrack === "1" || navigator.doNotTrack === "yes";

const describeInactive = (reason: InactiveAnalyticsReason): string => {
  switch (reason) {
    case "not-configured":
      return "NEXT_PUBLIC_MATOMO_URL ou NEXT_PUBLIC_MATOMO_SITE_ID est absente";
    case "disabled":
      return "NEXT_PUBLIC_RECORD_ANALYTICS n'est pas à true";
    case "do-not-track":
      return "Do Not Track est actif dans le navigateur";
  }
};

const createAnalytics = (): Analytics => {
  const matomoUrl = process.env.NEXT_PUBLIC_MATOMO_URL;
  const siteId = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;

  const analytics = createBrowserAnalytics({
    config:
      matomoUrl && siteId
        ? {
            matomoUrl,
            siteId,
            dimensionSlots: {},
            globalDimensions: {
              environnement: parseEnvironnement(
                process.env.NEXT_PUBLIC_ANALYTICS_ENVIRONNEMENT,
              ),
            },
          }
        : null,
    enabled: process.env.NEXT_PUBLIC_RECORD_ANALYTICS === "true",
    doNotTrack: respectDoNotTrack(),
    waitForDimensions: { timeoutMs: DIMENSIONS_TIMEOUT_MS },
  });

  void loadDimensionSlots(analytics);

  // eslint-disable-next-line no-console
  console.info(
    analytics.status.active
      ? `[analytics] actif — ${matomoUrl} (site ${siteId})`
      : `[analytics] inactif — ${describeInactive(analytics.status.reason)}`,
  );

  return analytics;
};

let instance: Analytics | undefined;

export const getAnalytics = (): Analytics => {
  if (typeof window === "undefined") return createMutedAnalytics("disabled");
  instance ??= createAnalytics();
  return instance;
};
