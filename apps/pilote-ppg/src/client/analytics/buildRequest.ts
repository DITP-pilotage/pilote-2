import {
  ANALYTICS_DIMENSIONS,
  type AnalyticsConfig,
  type AnalyticsDimensions,
  type AnalyticsEvent,
  type AnalyticsPageView,
} from "@/client/analytics/schema";

export type RequestContext = {
  pageUrl: string;
  random: string;
};

const baseParams = (config: AnalyticsConfig): URLSearchParams =>
  new URLSearchParams({ idsite: config.siteId, rec: "1", apiv: "1" });

const setDimensions = (
  params: URLSearchParams,
  config: AnalyticsConfig,
  dimensions: AnalyticsDimensions | undefined,
): Array<[string, string]> => {
  const unmapped: Array<[string, string]> = [];

  for (const dimension of ANALYTICS_DIMENSIONS) {
    const value =
      config.globalDimensions?.[dimension] ?? dimensions?.[dimension];
    if (value === undefined) continue;
    const slot = config.dimensionSlots[dimension];
    if (slot === undefined) unmapped.push([dimension, String(value)]);
    else params.set(`dimension${slot}`, String(value));
  }

  return unmapped.sort(([left], [right]) => left.localeCompare(right));
};

export const buildEventRequest = (
  event: AnalyticsEvent,
  config: AnalyticsConfig,
  context: RequestContext,
): string => {
  const params = baseParams(config);
  const unmapped = setDimensions(params, config, event.dimensions);
  const suffix = unmapped.map(([key, value]) => `${key}=${value}`).join("&");

  params.set("e_c", event.category);
  params.set("e_a", event.action);
  params.set("e_n", suffix ? `${event.name}?${suffix}` : event.name);
  params.set("url", context.pageUrl);
  params.set("rand", context.random);

  return params.toString();
};

// L'URL d'une page vue reste celle de la page : une dimension sans identifiant
// Matomo n'y est pas repliée, elle est abandonnée.
export const buildPageViewRequest = (
  pageView: AnalyticsPageView,
  config: AnalyticsConfig,
  context: RequestContext,
): string => {
  const params = baseParams(config);
  setDimensions(params, config, undefined);

  params.set("action_name", pageView.title);
  params.set("url", context.pageUrl);
  params.set("rand", context.random);

  return params.toString();
};
