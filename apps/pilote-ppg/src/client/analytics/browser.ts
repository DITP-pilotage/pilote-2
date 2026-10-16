import {
  buildEventRequest,
  buildPageViewRequest,
  type RequestContext,
} from "@/client/analytics/buildRequest";
import type {
  AnalyticsConfig,
  AnalyticsEvent,
  AnalyticsPageView,
} from "@/client/analytics/schema";

export type InactiveAnalyticsReason =
  "not-configured" | "disabled" | "do-not-track";

export type AnalyticsStatus =
  { active: true } | { active: false; reason: InactiveAnalyticsReason };

export type Analytics = {
  status: AnalyticsStatus;
  trackPageView: (pageView: AnalyticsPageView) => void;
  trackEvent: (event: AnalyticsEvent) => void;
};

export type BrowserAnalyticsOptions = {
  config: AnalyticsConfig | null;
  enabled: boolean;
  doNotTrack: boolean;
  send?: (url: string) => void;
  getPageUrl?: () => string;
};

export const createMutedAnalytics = (
  reason: InactiveAnalyticsReason,
): Analytics => ({
  status: { active: false, reason },
  trackPageView: () => {},
  trackEvent: () => {},
});

const sendBeacon = (url: string): void => {
  if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(url))
    return;
  void fetch(url, { method: "POST", mode: "no-cors", keepalive: true }).catch(
    () => {},
  );
};

const readPageUrl = (): string =>
  `${window.location.origin}${window.location.pathname}`;

export const createBrowserAnalytics = (
  options: BrowserAnalyticsOptions,
): Analytics => {
  const { config, enabled, doNotTrack } = options;
  if (!config) return createMutedAnalytics("not-configured");
  if (!enabled) return createMutedAnalytics("disabled");
  if (doNotTrack) return createMutedAnalytics("do-not-track");

  const send = options.send ?? sendBeacon;
  const getPageUrl = options.getPageUrl ?? readPageUrl;
  const endpoint = `${config.matomoUrl.replace(/\/$/, "")}/matomo.php`;

  const emit = (buildQuery: (context: RequestContext) => string): void => {
    try {
      const query = buildQuery({
        pageUrl: getPageUrl(),
        random: Math.random().toString(36).slice(2),
      });
      send(`${endpoint}?${query}`);
    } catch {
      // L'analytics ne peut pas casser l'application.
    }
  };

  return {
    status: { active: true },
    trackPageView: (pageView) =>
      emit((context) => buildPageViewRequest(pageView, config, context)),
    trackEvent: (event) =>
      emit((context) => buildEventRequest(event, config, context)),
  };
};
