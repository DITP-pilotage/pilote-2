import {
  ANALYTICS_DIMENSIONS,
  type AnalyticsConfig,
  type AnalyticsEvent,
} from "@/client/analytics/schema";

export type EventRequestContext = {
  pageUrl: string;
  visitorId?: string;
  random: string;
};

export const buildEventRequest = (
  event: AnalyticsEvent,
  config: AnalyticsConfig,
  context: EventRequestContext,
): string => {
  const params = new URLSearchParams({
    idsite: config.siteId,
    rec: "1",
    apiv: "1",
  });
  const unmapped: Array<[string, string]> = [];

  for (const dimension of ANALYTICS_DIMENSIONS) {
    const value = event.dimensions?.[dimension];
    if (value === undefined) continue;
    const slot = config.dimensionSlots[dimension];
    if (slot === undefined) unmapped.push([dimension, String(value)]);
    else params.set(`dimension${slot}`, String(value));
  }

  unmapped.sort(([left], [right]) => left.localeCompare(right));
  const suffix = unmapped.map(([key, value]) => `${key}=${value}`).join("&");

  params.set("e_c", event.category);
  params.set("e_a", event.action);
  params.set("e_n", suffix ? `${event.name}?${suffix}` : event.name);
  params.set("url", context.pageUrl);
  if (context.visitorId !== undefined) params.set("_id", context.visitorId);
  params.set("rand", context.random);

  return params.toString();
};
