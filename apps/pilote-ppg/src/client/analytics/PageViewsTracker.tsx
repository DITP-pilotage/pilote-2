import { useSession } from "next-auth/react";
import Router from "next/router";
import { useEffect, useRef } from "react";
import { getAnalytics } from "@/client/analytics/analytics";
import { trackPageViews } from "@/client/analytics/pageViews";

export const PageViewsTracker = () => {
  const { data: session, status } = useSession();
  const profil = useRef(session?.profil);
  const sessionLoaded = status !== "loading";

  useEffect(() => {
    profil.current = session?.profil;
  }, [session?.profil]);

  useEffect(() => {
    if (!sessionLoaded) return;
    return trackPageViews(Router, getAnalytics(), () => ({
      profil_pilote: profil.current,
    }));
  }, [sessionLoaded]);

  return null;
};
