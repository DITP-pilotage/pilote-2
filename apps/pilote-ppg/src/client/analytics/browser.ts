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
import type { DimensionSlots } from "@/shared/analytics/dimensions";

export type InactiveAnalyticsReason =
  "not-configured" | "disabled" | "do-not-track";

export type AnalyticsStatus =
  { active: true } | { active: false; reason: InactiveAnalyticsReason };

export type Analytics = {
  status: AnalyticsStatus;
  trackPageView: (pageView: AnalyticsPageView) => void;
  trackEvent: (event: AnalyticsEvent) => void;
  /** Donne les numéros Matomo des dimensions et libère les envois en attente. */
  setDimensionSlots: (slots: DimensionSlots) => void;
};

export type BrowserAnalyticsOptions = {
  config: AnalyticsConfig | null;
  enabled: boolean;
  doNotTrack: boolean;
  /**
   * Retient les envois jusqu'au premier `setDimensionSlots`, pour qu'ils portent leurs
   * dimensions. Passé le délai, ou si la page se ferme, ils partent sans.
   */
  waitForDimensions?: { timeoutMs: number };
  send?: (url: string) => void;
  getPageUrl?: () => string;
};

export const createMutedAnalytics = (
  reason: InactiveAnalyticsReason,
): Analytics => ({
  status: { active: false, reason },
  trackPageView: () => {},
  trackEvent: () => {},
  setDimensionSlots: () => {},
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

  let currentConfig = config;
  let pending: Array<() => void> | null = options.waitForDimensions ? [] : null;

  const emit = (
    buildQuery: (config: AnalyticsConfig, context: RequestContext) => string,
  ): void => {
    try {
      // La page est lue ici : une navigation peut précéder l'envoi.
      const context = {
        pageUrl: getPageUrl(),
        random: Math.random().toString(36).slice(2),
      };
      const sendNow = () => {
        try {
          send(`${endpoint}?${buildQuery(currentConfig, context)}`);
        } catch {
          // L'analytics ne peut pas casser l'application.
        }
      };
      if (pending) pending.push(sendNow);
      else sendNow();
    } catch {
      // L'analytics ne peut pas casser l'application.
    }
  };

  const release = (): void => {
    const released = pending ?? [];
    pending = null;
    for (const sendNow of released) sendNow();
  };

  if (options.waitForDimensions) {
    setTimeout(release, options.waitForDimensions.timeoutMs);
    window.addEventListener("pagehide", release);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") release();
    });
  }

  return {
    status: { active: true },
    trackPageView: (pageView) =>
      emit((latestConfig, context) =>
        buildPageViewRequest(pageView, latestConfig, context),
      ),
    trackEvent: (event) =>
      emit((latestConfig, context) =>
        buildEventRequest(event, latestConfig, context),
      ),
    setDimensionSlots: (dimensionSlots) => {
      currentConfig = { ...config, dimensionSlots };
      release();
    },
  };
};
