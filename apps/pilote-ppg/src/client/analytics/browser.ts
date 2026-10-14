import { buildEventRequest } from "@/client/analytics/buildRequest";
import type {
  AnalyticsConfig,
  AnalyticsEvent,
} from "@/client/analytics/schema";

declare global {
  interface Window {
    Matomo?: {
      getAsyncTracker?: () => { getVisitorId?: () => string } | undefined;
    };
  }
}

export type InactiveAnalyticsReason =
  "not-configured" | "disabled" | "do-not-track";

export type AnalyticsStatus =
  { active: true } | { active: false; reason: InactiveAnalyticsReason };

export type Analytics = {
  status: AnalyticsStatus;
  trackEvent: (event: AnalyticsEvent) => void;
};

export type BrowserAnalyticsOptions = {
  config: AnalyticsConfig | null;
  enabled: boolean;
  doNotTrack: boolean;
  send?: (url: string) => void;
  getVisitorId?: () => string | undefined;
  getPageUrl?: () => string;
};

export const createMutedAnalytics = (
  reason: InactiveAnalyticsReason,
): Analytics => ({
  status: { active: false, reason },
  trackEvent: () => {},
});

const sendBeacon = (url: string): void => {
  if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(url))
    return;
  void fetch(url, { method: "POST", mode: "no-cors", keepalive: true }).catch(
    () => {},
  );
};

const readMatomoVisitorId = (): string | undefined =>
  window.Matomo?.getAsyncTracker?.()?.getVisitorId?.();

const readPageUrl = (): string =>
  `${window.location.origin}${window.location.pathname}`;

const safeVisitorId = (
  getVisitorId: () => string | undefined,
): string | undefined => {
  try {
    return getVisitorId();
  } catch {
    return undefined;
  }
};

export const createBrowserAnalytics = (
  options: BrowserAnalyticsOptions,
): Analytics => {
  const { config, enabled, doNotTrack } = options;
  if (!config) return createMutedAnalytics("not-configured");
  if (!enabled) return createMutedAnalytics("disabled");
  if (doNotTrack) return createMutedAnalytics("do-not-track");

  const send = options.send ?? sendBeacon;
  const getVisitorId = options.getVisitorId ?? readMatomoVisitorId;
  const getPageUrl = options.getPageUrl ?? readPageUrl;
  const endpoint = `${config.matomoUrl.replace(/\/$/, "")}/matomo.php`;

  return {
    status: { active: true },
    trackEvent: (event) => {
      try {
        const query = buildEventRequest(event, config, {
          pageUrl: getPageUrl(),
          visitorId: safeVisitorId(getVisitorId),
          random: Math.random().toString(36).slice(2),
        });
        send(`${endpoint}?${query}`);
      } catch {
        // L'analytics ne peut pas casser l'application.
      }
    },
  };
};
