import type { Router } from "next/router";
import type { Analytics } from "@/client/analytics/browser";
import type { AnalyticsDimensions } from "@/client/analytics/schema";

const pathnameOf = (url: string): string => url.split(/[?#]/)[0];

// Les filtres vivent dans la query string (nuqs) : seul un changement de chemin
// compte comme une nouvelle page vue. Le titre est lu au tour suivant, une fois
// que next/head a mis à jour document.title.
export const trackPageViews = (
  router: Pick<Router, "events">,
  analytics: Analytics,
  getDimensions: () => AnalyticsDimensions,
): (() => void) => {
  let lastPathname: string | undefined;

  const track = (url: string) => {
    const pathname = pathnameOf(url);
    if (pathname === lastPathname) return;
    lastPathname = pathname;
    setTimeout(
      () =>
        analytics.trackPageView({
          title: document.title,
          dimensions: getDimensions(),
        }),
      0,
    );
  };

  track(window.location.pathname);
  router.events.on("routeChangeComplete", track);
  return () => router.events.off("routeChangeComplete", track);
};
