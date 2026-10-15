import { buildEventRequest } from "@/client/analytics/buildRequest";
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
