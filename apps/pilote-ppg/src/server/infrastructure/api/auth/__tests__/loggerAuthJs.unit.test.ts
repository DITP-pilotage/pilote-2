import { buildAuthJsErrorEvent } from "@/server/infrastructure/api/auth/loggerAuthJs";

class ErreurAuthJs extends Error {
  readonly type: string;

  constructor({
    type,
    message,
    cause,
  }: {
    type: string;
    message: string;
    cause?: unknown;
  }) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "OAuthCallbackError";
    this.type = type;
  }
}

describe("buildAuthJsErrorEvent", () => {
  it("prend le type Auth.js comme message, plus lisible que le nom de classe", () => {
    const erreur = new ErreurAuthJs({
      type: "OAuthCallbackError",
      message: "Echec du callback",
    });

    expect(buildAuthJsErrorEvent(erreur)).toMatchObject({
      message: "Echec du flux d'authentification : OAuthCallbackError",
      context: { errorMessage: "Echec du callback" },
    });
  });

  it("retombe sur le nom de l'erreur quand ce n'est pas une erreur Auth.js typée", () => {
    const erreur = new TypeError("fetch failed");

    expect(buildAuthJsErrorEvent(erreur)).toMatchObject({
      message: "Echec du flux d'authentification : TypeError",
    });
  });

  it("remonte l'erreur d'origine portée par la cause", () => {
    const origine = new Error("Appel userinfo ProConnect en échec (502)");
    const erreur = new ErreurAuthJs({
      type: "OAuthProfileParseError",
      message: "Profil illisible",
      cause: { err: origine, provider: "proconnect" },
    });

    expect(buildAuthJsErrorEvent(erreur).context).toMatchObject({
      provider: "proconnect",
      causeMessage: "Appel userinfo ProConnect en échec (502)",
    });
  });

  it("expose la pile de la cause comme trace persistée", () => {
    const origine = new Error("boum");
    const erreur = new ErreurAuthJs({
      type: "OAuthCallbackError",
      message: "Echec du callback",
      cause: { err: origine },
    });

    expect(buildAuthJsErrorEvent(erreur).context.errorStack).toBe(
      origine.stack,
    );
  });

  it("ne recopie pas les données arbitraires de la cause, qui peuvent porter une identité ou un jeton", () => {
    const erreur = new ErreurAuthJs({
      type: "OAuthCallbackError",
      message: "Echec du callback",
      cause: {
        err: new Error("boum"),
        provider: "proconnect",
        profile: { email: "agent@exemple.gouv.fr" },
        access_token: "jeton-secret",
      },
    });

    const context = buildAuthJsErrorEvent(erreur).context;

    expect(context).not.toHaveProperty("profile");
    expect(context).not.toHaveProperty("access_token");
    expect(JSON.stringify(context)).not.toContain("agent@exemple.gouv.fr");
    expect(JSON.stringify(context)).not.toContain("jeton-secret");
  });

  it("journalise en catégorie auth, dans la source authjs", () => {
    const erreur = new ErreurAuthJs({
      type: "Configuration",
      message: "Provider mal configuré",
    });

    expect(buildAuthJsErrorEvent(erreur).context).toMatchObject({
      categorie: "auth",
      source: "authjs",
    });
  });

  it("supporte une cause qui n'est pas de la forme attendue par Auth.js", () => {
    const erreur = new ErreurAuthJs({
      type: "OAuthCallbackError",
      message: "Echec du callback",
      cause: "une chaîne",
    });

    expect(() => buildAuthJsErrorEvent(erreur)).not.toThrow();
    expect(buildAuthJsErrorEvent(erreur).context).not.toHaveProperty(
      "causeMessage",
    );
  });
});
