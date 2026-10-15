import mitt from "next/dist/shared/lib/mitt";
import { createMutedAnalytics } from "@/client/analytics/browser";
import { trackPageViews } from "@/client/analytics/pageViews";

const setup = () => {
  const events = mitt();
  const analytics = {
    ...createMutedAnalytics("disabled"),
    trackPageView: vi.fn(),
  };
  const stop = trackPageViews({ events }, analytics);
  const navigate = (url: string) => {
    window.history.pushState(null, "", url);
    events.emit("routeChangeComplete", url);
    vi.runAllTimers();
  };
  return { analytics, stop, navigate };
};

describe("trackPageViews", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.history.replaceState(null, "", "/accueil");
    document.title = "Accueil";
  });

  afterEach(() => {
    vi.useRealTimers();
    window.history.replaceState(null, "", "/");
  });

  it("compte le premier chargement puis chaque changement de chemin", () => {
    const { analytics, navigate } = setup();
    vi.runAllTimers();

    document.title = "Chantier";
    navigate("/chantier/CH-001/NAT");

    expect(analytics.trackPageView.mock.calls).toEqual([
      [{ title: "Accueil" }],
      [{ title: "Chantier" }],
    ]);
  });

  it("ignore les changements de query string ou de fragment", () => {
    const { analytics, navigate } = setup();
    vi.runAllTimers();

    navigate("/accueil?territoire=NAT-FR");
    navigate("/accueil#indicateurs");

    expect(analytics.trackPageView).toHaveBeenCalledTimes(1);
  });

  it("cesse d'écouter le router une fois désabonné", () => {
    const { analytics, stop, navigate } = setup();
    vi.runAllTimers();

    stop();
    navigate("/chantier/CH-001/NAT");

    expect(analytics.trackPageView).toHaveBeenCalledTimes(1);
  });
});
