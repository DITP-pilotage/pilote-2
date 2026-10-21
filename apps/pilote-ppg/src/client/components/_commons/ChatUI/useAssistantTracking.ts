import { useCallback } from "react";
import {
  useAnalytics,
  type TrackedEvent,
} from "@/client/analytics/useAnalytics";

export type AssistantEvent = Omit<TrackedEvent, "category">;

export const useAssistantTracking = () => {
  const { trackEvent } = useAnalytics();

  return useCallback(
    (event: AssistantEvent) =>
      trackEvent({ ...event, category: "assistant_ia" }),
    [trackEvent],
  );
};
