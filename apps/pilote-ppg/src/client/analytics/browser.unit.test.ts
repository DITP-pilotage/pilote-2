import { createBrowserAnalytics } from "@/client/analytics/browser";
import type {
  AnalyticsConfig,
  AnalyticsEvent,
} from "@/client/analytics/schema";

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
});
