import { createBrowserAnalytics } from "@/client/analytics/browser";
import type {
  AnalyticsConfig,
  AnalyticsEvent,
} from "@/client/analytics/schema";

const config: AnalyticsConfig = {
  matomoUrl: "https://stats.example.org/",
  siteId: "103",
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
    delete window.Matomo;
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

  it("rattache l'événement au visiteur matomo.js quand il est chargé", () => {
    window.Matomo = {
      getAsyncTracker: () => ({ getVisitorId: () => "0123456789abcdef" }),
    };
    const send = vi.fn();

    createBrowserAnalytics({
      config,
      enabled: true,
      doNotTrack: false,
      send,
    }).trackEvent(event);

    expect(sentUrl(send).searchParams.get("_id")).toBe("0123456789abcdef");
  });

  it("émet sans identifiant visiteur si matomo.js lève une erreur", () => {
    const send = vi.fn();

    createBrowserAnalytics({
      config,
      enabled: true,
      doNotTrack: false,
      send,
      getVisitorId: () => {
        throw new Error("matomo.js indisponible");
      },
    }).trackEvent(event);

    expect(sentUrl(send).searchParams.has("_id")).toBe(false);
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
});
