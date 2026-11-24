import { createTRPCClient, httpLink } from "@trpc/client";
import superjson from "superjson";
import type { Analytics } from "@/client/analytics/browser";
import type { AppRouter } from "@/server/framework/trpc/trpc.interface";
import type { DimensionSlots } from "@/shared/analytics/dimensions";

// Sans batch : regroupée avec les requêtes de la page, la lecture attendrait la plus lente.
const fetchDimensionSlots = (): Promise<DimensionSlots> =>
  createTRPCClient<AppRouter>({
    links: [httpLink({ url: "/api/trpc", transformer: superjson })],
  }).analytics.dimensionSlots.query();

export const loadDimensionSlots = async (
  analytics: Analytics,
  fetchSlots: () => Promise<DimensionSlots> = fetchDimensionSlots,
): Promise<void> => {
  if (!analytics.status.active) return;
  try {
    analytics.setDimensionSlots(await fetchSlots());
  } catch {
    analytics.setDimensionSlots({});
  }
};
