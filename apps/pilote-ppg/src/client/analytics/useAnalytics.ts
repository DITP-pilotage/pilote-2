import { useSession } from "next-auth/react";
import { useCallback } from "react";
import { getAnalytics } from "@/client/analytics/analytics";
import type {
  AnalyticsDimensions,
  AnalyticsEvent,
} from "@/client/analytics/schema";

export type TrackedEvent = Omit<AnalyticsEvent, "dimensions"> & {
  dimensions?: Omit<AnalyticsDimensions, "profil_pilote" | "environnement">;
};

export const useAnalytics = () => {
  const { data: session } = useSession();
  const profil = session?.profil;

  const trackEvent = useCallback(
    (event: TrackedEvent) =>
      getAnalytics().trackEvent({
        ...event,
        dimensions: { ...event.dimensions, profil_pilote: profil },
      }),
    [profil],
  );

  return { trackEvent };
};
