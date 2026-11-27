import { createBrowserAnalytics } from "@/client/analytics/browser";
import type {
  AnalyticsConfig,
  AnalyticsEvent,
} from "@/client/analytics/schema";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

const config: AnalyticsConfig = {
  matomoUrl: "https://stats.example.org/",
  siteId: "42",
  dimensionSlots: {},
};

const event: AnalyticsEvent = {
  category: "assistant_ia",
  action: "open",
  name: "question.send",
};

const sentUrl = (send: ReturnType<typeof vi.fn>) =>
  new URL(String(send.mock.calls[0][0]));

describe("createBrowserAnalytics", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
    vi.unstubAllGlobals();
  });

  it.each([
    {
      options: { config: null, enabled: true, doNotTrack: false },
      reason: "not-configured",
    },
    {
      options: { config, enabled: false, doNotTrack: false },
      reason: "disabled",
    },
    {
      options: { config, enabled: true, doNotTrack: true },
      reason: "do-not-track",
    },
  ] as const)("reste muet : $reason", ({ options, reason }) => {
    const send = vi.fn();
    const analytics = createBrowserAnalytics({ ...options, send });

    analytics.trackEvent(event);
    analytics.trackPageView({ title: "Accueil" });

    expect(analytics.status).toEqual({ active: false, reason });
    expect(send).not.toHaveBeenCalled();
  });

  it("envoie vers matomo.php sans double slash", () => {
    const send = vi.fn();
    const analytics = createBrowserAnalytics({
      config,
      enabled: true,
      doNotTrack: false,
      send,
    });

    analytics.trackEvent(event);

    expect(analytics.status).toEqual({ active: true });
    const url = sentUrl(send);
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://stats.example.org/matomo.php",
    );
    expect(url.searchParams.get("e_a")).toBe("open");
  });

  it("ne transmet ni la query string ni le fragment de la page", () => {
    window.history.pushState(null, "", "/accueil?q=secret#ancre");
    const send = vi.fn();

    createBrowserAnalytics({
      config,
      enabled: true,
      doNotTrack: false,
      send,
    }).trackEvent(event);

    expect(sentUrl(send).searchParams.get("url")).toBe(
      `${window.location.origin}/accueil`,
    );
  });

  it("envoie une page vue avec son titre et sans la query string", () => {
    window.history.pushState(null, "", "/accueil?q=secret#ancre");
    const send = vi.fn();

    createBrowserAnalytics({
      config,
      enabled: true,
      doNotTrack: false,
      send,
    }).trackPageView({ title: "Accueil" });

    const url = sentUrl(send);
    expect(url.searchParams.get("action_name")).toBe("Accueil");
    expect(url.searchParams.get("url")).toBe(
      `${window.location.origin}/accueil`,
    );
    expect(url.searchParams.has("e_c")).toBe(false);
  });

  it("n'interrompt jamais l'appelant si l'envoi échoue", () => {
    const analytics = createBrowserAnalytics({
      config,
      enabled: true,
      doNotTrack: false,
      send: () => {
        throw new Error("réseau");
      },
    });

    expect(() => analytics.trackEvent(event)).not.toThrow();
  });

  it("se replie sur fetch quand le navigateur n'a pas sendBeacon", () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("fetch", fetchMock);

    createBrowserAnalytics({
      config,
      enabled: true,
      doNotTrack: false,
    }).trackEvent(event);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("https://stats.example.org/matomo.php?"),
      { method: "POST", mode: "no-cors", keepalive: true },
    );
  });

  it("se replie sur fetch quand sendBeacon refuse l'envoi", () => {
    const sendBeacon = vi.fn(() => false);
    const fetchMock = vi.fn(() => Promise.reject(new Error("réseau")));
    vi.stubGlobal("navigator", { sendBeacon });
    vi.stubGlobal("fetch", fetchMock);

    createBrowserAnalytics({
      config,
      enabled: true,
      doNotTrack: false,
    }).trackEvent(event);

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("https://stats.example.org/matomo.php?"),
      { method: "POST", mode: "no-cors", keepalive: true },
    );
  });

  describe("attente des dimensions", () => {
    const setup = () => {
      const send = vi.fn();
      const analytics = createBrowserAnalytics({
        config,
        enabled: true,
        doNotTrack: false,
        waitForDimensions: { timeoutMs: 3000 },
        send,
      });
      const sent = () =>
        send.mock.calls.map(([url]) => {
          const params = new URL(String(url)).searchParams;
          return {
            name: params.get("e_n"),
            page: params.get("url"),
            profil: params.get("dimension1"),
          };
        });
      return { analytics, sent };
    };

    const page = (path: string) => `${window.location.origin}${path}`;

    const hidePage = (visibilityState: "hidden" | "visible") => {
      vi.spyOn(document, "visibilityState", "get").mockReturnValue(
        visibilityState,
      );
      document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
    };

    const profiledEvent = {
      ...event,
      dimensions: { profil_pilote: ProfilEnum.DITP_ADMIN },
    } as const;

    beforeEach(() => {
      vi.useFakeTimers();
      window.history.replaceState(null, "", "/accueil");
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("retient les envois, puis les envoie dans l'ordre avec leurs dimensions", () => {
      const { analytics, sent } = setup();

      analytics.trackEvent(profiledEvent);
      analytics.trackEvent({ ...profiledEvent, name: "answer.stop" });
      expect(sent()).toEqual([]);
      analytics.setDimensionSlots({ profil_pilote: 1 });

      expect(sent()).toEqual([
        { name: "question.send", page: page("/accueil"), profil: "DITP_ADMIN" },
        { name: "answer.stop", page: page("/accueil"), profil: "DITP_ADMIN" },
      ]);
    });

    it("garde la page d'origine d'un événement quand la navigation précède l'envoi", () => {
      const { analytics, sent } = setup();

      analytics.trackEvent(profiledEvent);
      window.history.pushState(null, "", "/annuaire");
      analytics.setDimensionSlots({ profil_pilote: 1 });

      expect(sent()).toEqual([
        { name: "question.send", page: page("/accueil"), profil: "DITP_ADMIN" },
      ]);
    });

    it("envoie sans dimensions au bout du délai, puis applique une réponse tardive aux envois suivants", () => {
      const { analytics, sent } = setup();

      analytics.trackEvent(profiledEvent);
      vi.advanceTimersByTime(2999);
      expect(sent()).toEqual([]);
      vi.advanceTimersByTime(1);
      analytics.setDimensionSlots({ profil_pilote: 1 });
      analytics.trackEvent(profiledEvent);

      expect(sent()).toEqual([
        {
          name: "question.send?profil_pilote=DITP_ADMIN",
          page: page("/accueil"),
          profil: null,
        },
        { name: "question.send", page: page("/accueil"), profil: "DITP_ADMIN" },
      ]);
    });

    it("n'envoie rien deux fois quand le délai expire après la réponse", () => {
      const { analytics, sent } = setup();

      analytics.trackEvent(profiledEvent);
      analytics.setDimensionSlots({ profil_pilote: 1 });
      vi.advanceTimersByTime(3000);

      expect(sent()).toEqual([
        { name: "question.send", page: page("/accueil"), profil: "DITP_ADMIN" },
      ]);
    });

    it.each([
      {
        cas: "la page se ferme",
        leave: () => window.dispatchEvent(new Event("pagehide")),
      },
      {
        cas: "la page passe en arrière-plan",
        leave: () => hidePage("hidden"),
      },
    ])("libère les envois quand $cas", ({ leave }) => {
      const { analytics, sent } = setup();

      analytics.trackEvent(profiledEvent);
      leave();

      expect(sent()).toEqual([
        {
          name: "question.send?profil_pilote=DITP_ADMIN",
          page: page("/accueil"),
          profil: null,
        },
      ]);
    });

    it("retient toujours les envois quand la page redevient visible", () => {
      const { analytics, sent } = setup();

      analytics.trackEvent(profiledEvent);
      hidePage("visible");

      expect(sent()).toEqual([]);
    });
  });
});
