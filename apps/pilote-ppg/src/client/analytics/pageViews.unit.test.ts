import mitt from "next/dist/shared/lib/mitt";
import { createMutedAnalytics } from "@/client/analytics/browser";
import { trackPageViews } from "@/client/analytics/pageViews";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";
import type { ProfilCode } from "@/shared/utilisateur/Utilisateur.interface";

const setup = (getDimensions = () => ({})) => {
  const events = mitt();
  const analytics = {
    ...createMutedAnalytics("disabled"),
    trackPageView: vi.fn(),
  };
  const stop = trackPageViews({ events }, analytics, getDimensions);
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
      [{ title: "Accueil", dimensions: {} }],
      [{ title: "Chantier", dimensions: {} }],
    ]);
  });

  it("ignore les changements de query string ou de fragment", () => {
    const { analytics, navigate } = setup();
    vi.runAllTimers();

    navigate("/accueil?territoire=NAT-FR");
    navigate("/accueil#indicateurs");

    expect(analytics.trackPageView).toHaveBeenCalledTimes(1);
  });

  it("lit les dimensions au moment de l'envoi", () => {
    let profil: ProfilCode | undefined;
    const { analytics, navigate } = setup(() => ({ profil_pilote: profil }));
    vi.runAllTimers();

    profil = ProfilEnum.DITP_ADMIN;
    navigate("/chantier/CH-001/NAT");

    expect(analytics.trackPageView.mock.calls).toEqual([
      [{ title: "Accueil", dimensions: { profil_pilote: undefined } }],
      [
        {
          title: "Accueil",
          dimensions: { profil_pilote: ProfilEnum.DITP_ADMIN },
        },
      ],
    ]);
  });

  it("cesse d'écouter le router une fois désabonné", () => {
    const { analytics, stop, navigate } = setup();
    vi.runAllTimers();

    stop();
    navigate("/chantier/CH-001/NAT");

    expect(analytics.trackPageView).toHaveBeenCalledTimes(1);
  });
});
