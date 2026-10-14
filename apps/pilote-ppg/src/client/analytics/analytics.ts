import {
  createBrowserAnalytics,
  createMutedAnalytics,
  type Analytics,
  type InactiveAnalyticsReason,
} from "@/client/analytics/browser";
import {
  ANALYTICS_DIMENSIONS,
  type DimensionSlots,
} from "@/client/analytics/schema";

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

export const parseDimensionSlots = (
  raw: string | undefined,
): DimensionSlots => {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
    return {};

  const slots: DimensionSlots = {};
  for (const dimension of ANALYTICS_DIMENSIONS) {
    const slot: unknown = Reflect.get(parsed, dimension);
    if (isPositiveInteger(slot)) slots[dimension] = slot;
  }
  return slots;
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
            dimensionSlots: parseDimensionSlots(
              process.env.NEXT_PUBLIC_MATOMO_DIMENSIONS,
            ),
          }
        : null,
    enabled: process.env.NEXT_PUBLIC_RECORD_ANALYTICS === "true",
    doNotTrack: respectDoNotTrack(),
  });

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
