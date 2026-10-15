import { z } from "zod";
import {
  createBrowserAnalytics,
  createMutedAnalytics,
  type Analytics,
  type InactiveAnalyticsReason,
} from "@/client/analytics/browser";
import {
  ANALYTICS_DIMENSIONS,
  ANALYTICS_ENVIRONNEMENTS,
  type AnalyticsEnvironnement,
  type DimensionSlots,
} from "@/client/analytics/schema";

const dimensionSlotsSchema = z.record(z.string(), z.unknown());

const slotSchema = z.number().int().positive();

const parseJson = (raw: string) => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export const parseDimensionSlots = (
  raw: string | undefined,
): DimensionSlots => {
  if (!raw) return {};
  const result = dimensionSlotsSchema.safeParse(parseJson(raw));
  if (!result.success) return {};

  const slots: DimensionSlots = {};
  for (const dimension of ANALYTICS_DIMENSIONS) {
    const slot = slotSchema.safeParse(result.data[dimension]);
    if (slot.success) slots[dimension] = slot.data;
  }
  return slots;
};

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
            dimensionSlots: parseDimensionSlots(
              process.env.NEXT_PUBLIC_MATOMO_DIMENSIONS,
            ),
            globalDimensions: {
              environnement: parseEnvironnement(
                process.env.NEXT_PUBLIC_ANALYTICS_ENVIRONNEMENT,
              ),
            },
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
