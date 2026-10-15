# Socle de suivi des événements Matomo (pilote-ppg) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner à pilote-ppg un émetteur d'événements produit vers l'API HTTP de Matomo, avec un contrat typé fermé, sans brancher aucun événement dans l'UI.

**Architecture:** Portage adapté du socle `packages/kpilote-shared/src/analytics` dans `apps/pilote-ppg/src/client/analytics/` : `schema` (contrat) → `buildRequest` (query string pure) → `browser` (émetteur actif ou muet, jamais bloquant) → `analytics` (instance unique lue depuis `NEXT_PUBLIC_*`) → `useAnalytics` (hook qui injecte le profil de la session).

**Tech Stack:** Next.js (pages router), TypeScript, next-auth (`useSession`), vitest (projet `client`, jsdom, globals).

**Spec:** `docs/superpowers/specs/2026-10-14-ppg-matomo-events-design.md`

## Global Constraints

- ppg n'importe aucun package `kpilote-*` : le code est porté, pas importé.
- Identifiants techniques en anglais, sans accents ; termes domaine en français. Les noms de dimensions (`profil_pilote`, `type_question`…) sont le contrat Matomo : tels quels.
- Exports nommés uniquement ; pas de `as never` ni `as unknown`.
- Pas de commentaires explicatifs superflus.
- Paramètre de l'API de tracking : `dimension<idcustomdimension>`. Les identifiants réels ne sont jamais écrits dans le dépôt (ni code, ni tests, ni docs, ni `.env.example`) : uniquement dans l'env des environnements.
- Activation : `NEXT_PUBLIC_RECORD_ANALYTICS === "true"` + `NEXT_PUBLIC_MATOMO_URL` + `NEXT_PUBLIC_MATOMO_SITE_ID` ; Do Not Track respecté.
- `trackEvent` ne lève jamais.
- `url` transmise = origine + chemin, sans query string ni fragment.
- `_app.tsx` et le suivi des pages vues restent inchangés.
- Commandes lancées depuis la racine du worktree, jamais de `cd`.
- `pnpm --filter @pilote/ppg lint` avant chaque commit ; commits via le skill commit-billable (Client `DITP-pilotage`, ticket `PIL-1880`, tags `analytics`).

## Review Focus

- Clé de dimension inconnue passée au runtime (objet construit dynamiquement par une US) : elle ne doit jamais partir → `buildEventRequest` itère sur `ANALYTICS_DIMENSIONS`, pas sur `Object.entries` (test Task 1).
- `matomo.js` pas encore chargé, ou `getVisitorId` qui lève : l'événement part quand même, sans `_id` (test Task 2).
- `navigator.sendBeacon` absent ou qui renvoie `false` : repli `fetch` sans exception remontée (test Task 2).
- URL de page avec query string sensible (`?q=…`) ou fragment : jamais transmise (test Task 2, via `history.pushState`).
- `NEXT_PUBLIC_MATOMO_URL` avec slash final : pas de `//matomo.php` (test Task 2).

---

## File Structure

| Fichier | Responsabilité |
|---|---|
| `apps/pilote-ppg/src/client/analytics/schema.ts` | Contrat : catégories, actions, noms, dimensions, types `AnalyticsEvent`, `AnalyticsConfig` |
| `apps/pilote-ppg/src/client/analytics/buildRequest.ts` | Événement → query string `matomo.php` (pur) |
| `apps/pilote-ppg/src/client/analytics/browser.ts` | `createBrowserAnalytics` : garde, envoi beacon, pont visiteur `matomo.js` |
| `apps/pilote-ppg/src/client/analytics/analytics.ts` | `parseDimensionSlots`, `getAnalytics` (instance unique, lazy, muette en SSR) |
| `apps/pilote-ppg/src/client/analytics/useAnalytics.ts` | Hook : injecte `profil_pilote` depuis la session |
| `apps/pilote-ppg/src/config.ts`, `apps/pilote-ppg/.env.example` | Déclaration de `NEXT_PUBLIC_MATOMO_DIMENSIONS` |

---

### Task 1: Contrat et construction de la requête

**Files:**
- Create: `apps/pilote-ppg/src/client/analytics/schema.ts`
- Create: `apps/pilote-ppg/src/client/analytics/buildRequest.ts`
- Test: `apps/pilote-ppg/src/client/analytics/buildRequest.unit.test.ts`

**Interfaces:**
- Produces:
  - `ANALYTICS_DIMENSIONS: readonly AnalyticsDimension[]`
  - `type AnalyticsDimension`, `type AnalyticsDimensions`, `type DimensionSlots = Partial<Record<AnalyticsDimension, number>>`
  - `type AnalyticsEvent = { category: AnalyticsCategory; action: AnalyticsAction; name: AnalyticsEventName; dimensions?: AnalyticsDimensions }`
  - `type AnalyticsConfig = { matomoUrl: string; siteId: string; dimensionSlots: DimensionSlots }`
  - `type EventRequestContext = { pageUrl: string; visitorId?: string; random: string }`
  - `buildEventRequest(event: AnalyticsEvent, config: AnalyticsConfig, context: EventRequestContext): string`

- [ ] **Step 1: Écrire `schema.ts`**

```ts
import type { ProfilCode } from "@/shared/utilisateur/Utilisateur.interface";

export const ANALYTICS_CATEGORIES = ["assistant_ia"] as const;

export type AnalyticsCategory = (typeof ANALYTICS_CATEGORIES)[number];

export const ANALYTICS_ACTIONS = [
  "view",
  "open",
  "minimize",
  "resume",
  "close",
  "select",
  "submit",
  "start",
  "stop",
  "retry",
  "success",
  "error",
] as const;

export type AnalyticsAction = (typeof ANALYTICS_ACTIONS)[number];

export const ANALYTICS_EVENT_NAMES = [
  "question.send",
  "response.choices",
  "response.choice",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export type AnalyticsDimensions = {
  profil_pilote?: ProfilCode;
  conversation_id?: string;
  llm_call_id?: string;
  proposition_id?: string;
  proposition_mode?: "envoi_direct" | "preremplissage";
  type_question?: "premiere_libre" | "premiere_proposition" | "suivante";
  nombre_choix?: number;
  position_choix?: number;
};

export type AnalyticsDimension = keyof AnalyticsDimensions;

export const ANALYTICS_DIMENSIONS = [
  "profil_pilote",
  "conversation_id",
  "llm_call_id",
  "proposition_id",
  "proposition_mode",
  "type_question",
  "nombre_choix",
  "position_choix",
] as const satisfies readonly AnalyticsDimension[];

export type DimensionSlots = Partial<Record<AnalyticsDimension, number>>;

export type AnalyticsEvent = {
  category: AnalyticsCategory;
  action: AnalyticsAction;
  name: AnalyticsEventName;
  dimensions?: AnalyticsDimensions;
};

export type AnalyticsConfig = {
  matomoUrl: string;
  siteId: string;
  dimensionSlots: DimensionSlots;
};
```

- [ ] **Step 2: Écrire le test qui échoue**

`apps/pilote-ppg/src/client/analytics/buildRequest.unit.test.ts` :

```ts
import { buildEventRequest } from "@/client/analytics/buildRequest";
import type {
  AnalyticsConfig,
  AnalyticsEvent,
} from "@/client/analytics/schema";

const config: AnalyticsConfig = {
  matomoUrl: "https://stats.example.org",
  siteId: "42",
  dimensionSlots: { profil_pilote: 11, conversation_id: 12 },
};

const event: AnalyticsEvent = {
  category: "assistant_ia",
  action: "submit",
  name: "question.send",
};

const context = { pageUrl: "https://pilote.example.org/accueil", random: "r1" };

const parse = (query: string) => new URLSearchParams(query);

describe("buildEventRequest", () => {
  it("transmet la catégorie, l'action, le nom, le site et la page", () => {
    const params = parse(buildEventRequest(event, config, context));

    expect(params.get("idsite")).toBe("42");
    expect(params.get("rec")).toBe("1");
    expect(params.get("apiv")).toBe("1");
    expect(params.get("e_c")).toBe("assistant_ia");
    expect(params.get("e_a")).toBe("submit");
    expect(params.get("e_n")).toBe("question.send");
    expect(params.get("url")).toBe("https://pilote.example.org/accueil");
    expect(params.get("rand")).toBe("r1");
  });

  it("envoie une dimension configurée sous son identifiant Matomo", () => {
    const params = parse(
      buildEventRequest(
        {
          ...event,
          dimensions: { profil_pilote: "DITP_ADMIN", conversation_id: "c-1" },
        },
        config,
        context,
      ),
    );

    expect(params.get("dimension11")).toBe("DITP_ADMIN");
    expect(params.get("dimension12")).toBe("c-1");
    expect(params.get("e_n")).toBe("question.send");
  });

  it("replie dans le nom, triées par clé, les dimensions sans identifiant", () => {
    const params = parse(
      buildEventRequest(
        {
          ...event,
          dimensions: { type_question: "suivante", llm_call_id: "l-1" },
        },
        config,
        context,
      ),
    );

    expect(params.get("e_n")).toBe(
      "question.send?llm_call_id=l-1&type_question=suivante",
    );
  });

  it("ignore les dimensions non renseignées", () => {
    const params = parse(
      buildEventRequest(
        { ...event, dimensions: { conversation_id: undefined } },
        config,
        context,
      ),
    );

    expect(params.has("dimension12")).toBe(false);
    expect(params.get("e_n")).toBe("question.send");
  });

  it("n'envoie jamais une clé hors du schéma", () => {
    const dimensions = { conversation_id: "c-1", question: "texte libre" };
    const params = parse(
      buildEventRequest({ ...event, dimensions }, config, context),
    );

    expect(buildEventRequest({ ...event, dimensions }, config, context)).not.toContain(
      "texte",
    );
    expect(params.get("dimension12")).toBe("c-1");
  });

  it("transmet les nombres en texte", () => {
    const params = parse(
      buildEventRequest(
        { ...event, name: "response.choices", dimensions: { nombre_choix: 3 } },
        { ...config, dimensionSlots: { nombre_choix: 17 } },
        context,
      ),
    );

    expect(params.get("dimension17")).toBe("3");
  });

  it("n'ajoute l'identifiant visiteur que s'il est fourni", () => {
    expect(parse(buildEventRequest(event, config, context)).has("_id")).toBe(
      false,
    );
    expect(
      parse(
        buildEventRequest(event, config, {
          ...context,
          visitorId: "0123456789abcdef",
        }),
      ).get("_id"),
    ).toBe("0123456789abcdef");
  });
});
```

Note : le test « hors du schéma » passe un objet littéral contenant `question` via une variable intermédiaire, ce que TypeScript accepte (pas de contrôle d'excès de propriétés hors littéral direct). C'est voulu : il simule une US qui construirait ses dimensions dynamiquement.

- [ ] **Step 3: Vérifier qu'il échoue**

Run: `pnpm --filter @pilote/ppg exec vitest run --project client src/client/analytics/buildRequest.unit.test.ts`
Expected: FAIL — `Failed to resolve import "@/client/analytics/buildRequest"`.

- [ ] **Step 4: Écrire `buildRequest.ts`**

```ts
import {
  ANALYTICS_DIMENSIONS,
  type AnalyticsConfig,
  type AnalyticsEvent,
} from "@/client/analytics/schema";

export type EventRequestContext = {
  pageUrl: string;
  visitorId?: string;
  random: string;
};

export const buildEventRequest = (
  event: AnalyticsEvent,
  config: AnalyticsConfig,
  context: EventRequestContext,
): string => {
  const params = new URLSearchParams({
    idsite: config.siteId,
    rec: "1",
    apiv: "1",
  });
  const unmapped: Array<[string, string]> = [];

  for (const dimension of ANALYTICS_DIMENSIONS) {
    const value = event.dimensions?.[dimension];
    if (value === undefined) continue;
    const slot = config.dimensionSlots[dimension];
    if (slot === undefined) unmapped.push([dimension, String(value)]);
    else params.set(`dimension${slot}`, String(value));
  }

  unmapped.sort(([left], [right]) => left.localeCompare(right));
  const suffix = unmapped.map(([key, value]) => `${key}=${value}`).join("&");

  params.set("e_c", event.category);
  params.set("e_a", event.action);
  params.set("e_n", suffix ? `${event.name}?${suffix}` : event.name);
  params.set("url", context.pageUrl);
  if (context.visitorId !== undefined) params.set("_id", context.visitorId);
  params.set("rand", context.random);

  return params.toString();
};
```

- [ ] **Step 5: Vérifier que les tests passent**

Run: `pnpm --filter @pilote/ppg exec vitest run --project client src/client/analytics/buildRequest.unit.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Lint et commit**

Run: `pnpm --filter @pilote/ppg lint` → aucune erreur (corriger le formatage avec `pnpm --filter @pilote/ppg exec prettier --write src/client/analytics` si `format:check` échoue).
Commit (commit-billable) : `feature(PIL-1880): contrat typé et construction des requêtes Matomo ppg`.

---

### Task 2: Émetteur navigateur

**Files:**
- Create: `apps/pilote-ppg/src/client/analytics/browser.ts`
- Test: `apps/pilote-ppg/src/client/analytics/browser.unit.test.ts`

**Interfaces:**
- Consumes: `buildEventRequest`, `AnalyticsConfig`, `AnalyticsEvent` (Task 1).
- Produces:
  - `type InactiveAnalyticsReason = "not-configured" | "disabled" | "do-not-track"`
  - `type AnalyticsStatus = { active: true } | { active: false; reason: InactiveAnalyticsReason }`
  - `type Analytics = { status: AnalyticsStatus; trackEvent: (event: AnalyticsEvent) => void }`
  - `createBrowserAnalytics(options: BrowserAnalyticsOptions): Analytics`
  - `BrowserAnalyticsOptions = { config: AnalyticsConfig | null; enabled: boolean; doNotTrack: boolean; send?: (url: string) => void; getVisitorId?: () => string | undefined; getPageUrl?: () => string }`

- [ ] **Step 1: Écrire le test qui échoue**

`apps/pilote-ppg/src/client/analytics/browser.unit.test.ts` :

```ts
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

const sentParams = (send: ReturnType<typeof vi.fn>) => {
  const url = new URL(String(send.mock.calls[0][0]));
  return { url, params: url.searchParams };
};

describe("createBrowserAnalytics", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
    delete window.Matomo;
  });

  it.each([
    { options: { config: null, enabled: true, doNotTrack: false }, reason: "not-configured" },
    { options: { config, enabled: false, doNotTrack: false }, reason: "disabled" },
    { options: { config, enabled: true, doNotTrack: true }, reason: "do-not-track" },
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
    const { url, params } = sentParams(send);
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://stats.example.org/matomo.php",
    );
    expect(params.get("e_a")).toBe("open");
  });

  it("ne transmet ni la query string ni le fragment de la page", () => {
    window.history.pushState(null, "", "/accueil?q=secret#ancre");
    const send = vi.fn();

    createBrowserAnalytics({ config, enabled: true, doNotTrack: false, send }).trackEvent(event);

    expect(sentParams(send).params.get("url")).toBe(
      `${window.location.origin}/accueil`,
    );
  });

  it("rattache l'événement au visiteur matomo.js quand il est chargé", () => {
    window.Matomo = {
      getAsyncTracker: () => ({ getVisitorId: () => "0123456789abcdef" }),
    };
    const send = vi.fn();

    createBrowserAnalytics({ config, enabled: true, doNotTrack: false, send }).trackEvent(event);

    expect(sentParams(send).params.get("_id")).toBe("0123456789abcdef");
  });

  it("émet sans identifiant visiteur si matomo.js n'est pas chargé ou lève", () => {
    const send = vi.fn();
    const analytics = createBrowserAnalytics({
      config,
      enabled: true,
      doNotTrack: false,
      send,
      getVisitorId: () => {
        throw new Error("matomo.js absent");
      },
    });

    analytics.trackEvent(event);

    expect(sentParams(send).params.has("_id")).toBe(false);
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
    vi.stubGlobal("navigator", { ...navigator, sendBeacon });
    vi.stubGlobal("fetch", fetchMock);

    createBrowserAnalytics({ config, enabled: true, doNotTrack: false }).trackEvent(event);

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("https://stats.example.org/matomo.php?"),
      { method: "POST", mode: "no-cors", keepalive: true },
    );
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 2: Vérifier qu'il échoue**

Run: `pnpm --filter @pilote/ppg exec vitest run --project client src/client/analytics/browser.unit.test.ts`
Expected: FAIL — `Failed to resolve import "@/client/analytics/browser"`.

- [ ] **Step 3: Écrire `browser.ts`**

```ts
import { buildEventRequest } from "@/client/analytics/buildRequest";
import type {
  AnalyticsConfig,
  AnalyticsEvent,
} from "@/client/analytics/schema";

declare global {
  interface Window {
    Matomo?: {
      getAsyncTracker?: () => { getVisitorId?: () => string } | undefined;
    };
  }
}

export type InactiveAnalyticsReason =
  | "not-configured"
  | "disabled"
  | "do-not-track";

export type AnalyticsStatus =
  | { active: true }
  | { active: false; reason: InactiveAnalyticsReason };

export type Analytics = {
  status: AnalyticsStatus;
  trackEvent: (event: AnalyticsEvent) => void;
};

export type BrowserAnalyticsOptions = {
  config: AnalyticsConfig | null;
  enabled: boolean;
  doNotTrack: boolean;
  send?: (url: string) => void;
  getVisitorId?: () => string | undefined;
  getPageUrl?: () => string;
};

export const createMutedAnalytics = (
  reason: InactiveAnalyticsReason,
): Analytics => ({
  status: { active: false, reason },
  trackEvent: () => {},
});

const sendBeacon = (url: string): void => {
  if (navigator.sendBeacon(url)) return;
  void fetch(url, { method: "POST", mode: "no-cors", keepalive: true }).catch(
    () => {},
  );
};

const readMatomoVisitorId = (): string | undefined =>
  window.Matomo?.getAsyncTracker?.()?.getVisitorId?.();

const readPageUrl = (): string =>
  `${window.location.origin}${window.location.pathname}`;

const safeVisitorId = (
  getVisitorId: () => string | undefined,
): string | undefined => {
  try {
    return getVisitorId();
  } catch {
    return undefined;
  }
};

export const createBrowserAnalytics = (
  options: BrowserAnalyticsOptions,
): Analytics => {
  const { config, enabled, doNotTrack } = options;
  if (!config) return createMutedAnalytics("not-configured");
  if (!enabled) return createMutedAnalytics("disabled");
  if (doNotTrack) return createMutedAnalytics("do-not-track");

  const send = options.send ?? sendBeacon;
  const getVisitorId = options.getVisitorId ?? readMatomoVisitorId;
  const getPageUrl = options.getPageUrl ?? readPageUrl;
  const endpoint = `${config.matomoUrl.replace(/\/$/, "")}/matomo.php`;

  return {
    status: { active: true },
    trackEvent: (event) => {
      try {
        const query = buildEventRequest(event, config, {
          pageUrl: getPageUrl(),
          visitorId: safeVisitorId(getVisitorId),
          random: Math.random().toString(36).slice(2),
        });
        send(`${endpoint}?${query}`);
      } catch {
        // L'analytics ne peut pas casser l'application.
      }
    },
  };
};
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `pnpm --filter @pilote/ppg exec vitest run --project client src/client/analytics`
Expected: PASS (Task 1 + Task 2, 16 tests au total).

Si `vi.stubGlobal("navigator", …)` ne remplace pas `navigator.sendBeacon` sous jsdom, utiliser à la place `Object.defineProperty(navigator, "sendBeacon", { value: sendBeacon, configurable: true })` puis le supprimer en fin de test.

- [ ] **Step 5: Lint et commit**

Run: `pnpm --filter @pilote/ppg lint` → aucune erreur.
Commit (commit-billable) : `feature(PIL-1880): émetteur Matomo navigateur non bloquant ppg`.

---

### Task 3: Instance unique et configuration

**Files:**
- Create: `apps/pilote-ppg/src/client/analytics/analytics.ts`
- Test: `apps/pilote-ppg/src/client/analytics/analytics.unit.test.ts`
- Modify: `apps/pilote-ppg/src/config.ts` (section `analytics`, après `estRecordActive`)
- Modify: `apps/pilote-ppg/.env.example` (après `NEXT_PUBLIC_MATOMO_SITE_ID`)

**Interfaces:**
- Consumes: `createBrowserAnalytics`, `createMutedAnalytics`, `Analytics`, `InactiveAnalyticsReason` (Task 2) ; `ANALYTICS_DIMENSIONS`, `DimensionSlots` (Task 1).
- Produces:
  - `parseDimensionSlots(raw: string | undefined): DimensionSlots`
  - `getAnalytics(): Analytics`

- [ ] **Step 1: Écrire le test qui échoue**

`apps/pilote-ppg/src/client/analytics/analytics.unit.test.ts` :

```ts
import { parseDimensionSlots } from "@/client/analytics/analytics";

describe("parseDimensionSlots", () => {
  it("lit la correspondance dimension → identifiant Matomo", () => {
    expect(
      parseDimensionSlots('{"profil_pilote":11,"conversation_id":12}'),
    ).toEqual({ profil_pilote: 11, conversation_id: 12 });
  });

  it.each([undefined, "", "pas du json", "[1,2]", "null", "3"])(
    "donne une correspondance vide pour %s",
    (raw) => {
      expect(parseDimensionSlots(raw)).toEqual({});
    },
  );

  it("ignore les clés hors schéma et les identifiants non entiers positifs", () => {
    expect(
      parseDimensionSlots(
        '{"profil_pilote":11,"inconnue":12,"llm_call_id":"3","nombre_choix":0,"position_choix":1.5}',
      ),
    ).toEqual({ profil_pilote: 11 });
  });
});
```

- [ ] **Step 2: Vérifier qu'il échoue**

Run: `pnpm --filter @pilote/ppg exec vitest run --project client src/client/analytics/analytics.unit.test.ts`
Expected: FAIL — `Failed to resolve import "@/client/analytics/analytics"`.

- [ ] **Step 3: Écrire `analytics.ts`**

Les `process.env.NEXT_PUBLIC_*` doivent rester écrits en toutes lettres pour que Next les inline au build.

```ts
import {
  createBrowserAnalytics,
  createMutedAnalytics,
  type Analytics,
  type InactiveAnalyticsReason,
} from "@/client/analytics/browser";
import {
  ANALYTICS_DIMENSIONS,
  type DimensionSlots,
} from "@/client/analytics/schema";

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

export const parseDimensionSlots = (raw: string | undefined): DimensionSlots => {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
    return {};

  const slots: DimensionSlots = {};
  for (const dimension of ANALYTICS_DIMENSIONS) {
    const slot: unknown = Reflect.get(parsed, dimension);
    if (isPositiveInteger(slot)) slots[dimension] = slot;
  }
  return slots;
};

const respectDoNotTrack = (): boolean =>
  navigator.doNotTrack === "1" || navigator.doNotTrack === "yes";

const describeInactive = (reason: InactiveAnalyticsReason): string => {
  switch (reason) {
    case "not-configured":
      return "NEXT_PUBLIC_MATOMO_URL ou NEXT_PUBLIC_MATOMO_SITE_ID est absente";
    case "disabled":
      return "NEXT_PUBLIC_RECORD_ANALYTICS n'est pas à true";
    case "do-not-track":
      return "Do Not Track est actif dans le navigateur";
  }
};

const createAnalytics = (): Analytics => {
  const matomoUrl = process.env.NEXT_PUBLIC_MATOMO_URL;
  const siteId = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;

  const analytics = createBrowserAnalytics({
    config:
      matomoUrl && siteId
        ? {
            matomoUrl,
            siteId,
            dimensionSlots: parseDimensionSlots(
              process.env.NEXT_PUBLIC_MATOMO_DIMENSIONS,
            ),
          }
        : null,
    enabled: process.env.NEXT_PUBLIC_RECORD_ANALYTICS === "true",
    doNotTrack: respectDoNotTrack(),
  });

  console.info(
    analytics.status.active
      ? `[analytics] actif — ${matomoUrl} (site ${siteId})`
      : `[analytics] inactif — ${describeInactive(analytics.status.reason)}`,
  );

  return analytics;
};

let instance: Analytics | undefined;

export const getAnalytics = (): Analytics => {
  if (typeof window === "undefined") return createMutedAnalytics("disabled");
  instance ??= createAnalytics();
  return instance;
};
```

`Reflect.get` évite un cast de `parsed` en `Record<string, unknown>` (règle : pas de `as unknown`). Si oxlint le refuse, utiliser `Object.entries(parsed)` converti en `Map` puis `map.get(dimension)`.

- [ ] **Step 4: Vérifier que les tests passent**

Run: `pnpm --filter @pilote/ppg exec vitest run --project client src/client/analytics`
Expected: PASS (Tasks 1 à 3).

- [ ] **Step 5: Déclarer la variable d'env**

Dans `apps/pilote-ppg/src/config.ts`, section `analytics`, après le bloc `estRecordActive` :

```ts
    dimensions: {
      doc: "Correspondance dimension → identifiant Matomo (JSON), ex. {\"nom_dimension\":12}",
      format: String,
      default: "",
      env: "NEXT_PUBLIC_MATOMO_DIMENSIONS",
    },
```

Dans `apps/pilote-ppg/.env.example`, après `NEXT_PUBLIC_MATOMO_SITE_ID=TBD` :

```
NEXT_PUBLIC_MATOMO_DIMENSIONS=TBD
```

- [ ] **Step 6: Lint et commit**

Run: `pnpm --filter @pilote/ppg lint` → aucune erreur.
Commit (commit-billable) : `feature(PIL-1880): instance analytics ppg et correspondance des dimensions par env`.

---

### Task 4: Hook `useAnalytics`

**Files:**
- Create: `apps/pilote-ppg/src/client/analytics/useAnalytics.ts`

**Interfaces:**
- Consumes: `getAnalytics` (Task 3) ; `AnalyticsEvent`, `AnalyticsDimensions` (Task 1).
- Produces:
  - `type TrackedEvent = Omit<AnalyticsEvent, "dimensions"> & { dimensions?: Omit<AnalyticsDimensions, "profil_pilote"> }`
  - `useAnalytics(): { trackEvent: (event: TrackedEvent) => void }`

Pas de test : hook front de trois lignes, la logique est couverte par les Tasks 1 à 3.

- [ ] **Step 1: Écrire `useAnalytics.ts`**

```ts
import { useSession } from "next-auth/react";
import { useCallback } from "react";
import { getAnalytics } from "@/client/analytics/analytics";
import type {
  AnalyticsDimensions,
  AnalyticsEvent,
} from "@/client/analytics/schema";

export type TrackedEvent = Omit<AnalyticsEvent, "dimensions"> & {
  dimensions?: Omit<AnalyticsDimensions, "profil_pilote">;
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
```

- [ ] **Step 2: Vérification complète**

Run: `pnpm --filter @pilote/ppg lint` → aucune erreur.
Run: `pnpm --filter @pilote/ppg exec vitest run --project client src/client/analytics` → PASS.

- [ ] **Step 3: Commit**

Commit (commit-billable) : `feature(PIL-1880): hook useAnalytics injectant le profil PILOTE`.

---

## Recette (après merge, par le user)

Sur un environnement avec `NEXT_PUBLIC_RECORD_ANALYTICS=true` et `NEXT_PUBLIC_MATOMO_DIMENSIONS` renseignée, aucune US n'étant encore branchée : vérifier dans la console du navigateur la ligne `[analytics] actif — …`. La visibilité d'un événement dans Matomo se vérifie au branchement de la première US.
