import {
  buildEventRequest,
  buildPageViewRequest,
} from "@/client/analytics/buildRequest";
import type {
  AnalyticsConfig,
  AnalyticsEvent,
} from "@/client/analytics/schema";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

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

const context = {
  pageUrl: "https://pilote.example.org/accueil",
  random: "r1",
};

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
          dimensions: {
            profil_pilote: ProfilEnum.DITP_ADMIN,
            conversation_id: "c-1",
          },
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
    const query = buildEventRequest({ ...event, dimensions }, config, context);

    expect(query).not.toContain("texte");
    expect(parse(query).get("dimension12")).toBe("c-1");
  });

  it("ajoute les dimensions globales de la configuration", () => {
    const params = parse(
      buildEventRequest(
        event,
        {
          ...config,
          dimensionSlots: { environnement: 19 },
          globalDimensions: { environnement: "dev" },
        },
        context,
      ),
    );

    expect(params.get("dimension19")).toBe("dev");
  });

  it("fait primer une dimension globale sur celle de l'événement", () => {
    const params = parse(
      buildEventRequest(
        { ...event, dimensions: { environnement: "prod" } },
        {
          ...config,
          dimensionSlots: { environnement: 19 },
          globalDimensions: { environnement: "dev" },
        },
        context,
      ),
    );

    expect(params.get("dimension19")).toBe("dev");
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
});

describe("buildPageViewRequest", () => {
  it("transmet le titre, la page et le site sans paramètre d'événement", () => {
    const params = parse(
      buildPageViewRequest({ title: "Accueil" }, config, context),
    );

    expect(Object.fromEntries(params)).toEqual({
      idsite: "42",
      rec: "1",
      apiv: "1",
      action_name: "Accueil",
      url: "https://pilote.example.org/accueil",
      rand: "r1",
    });
  });

  it("ajoute les dimensions globales configurées et ignore les autres", () => {
    const params = parse(
      buildPageViewRequest(
        { title: "Accueil" },
        {
          ...config,
          dimensionSlots: { environnement: 19 },
          globalDimensions: { environnement: "dev", conversation_id: "c-1" },
        },
        context,
      ),
    );

    expect(params.get("dimension19")).toBe("dev");
    expect(params.get("url")).toBe("https://pilote.example.org/accueil");
    expect(params.toString()).not.toContain("c-1");
  });

  it("transmet les dimensions de la page vue dans leur slot", () => {
    const params = parse(
      buildPageViewRequest(
        {
          title: "Accueil",
          dimensions: { profil_pilote: ProfilEnum.DITP_ADMIN },
        },
        config,
        context,
      ),
    );

    expect(params.get("dimension11")).toBe(ProfilEnum.DITP_ADMIN);
  });
});
