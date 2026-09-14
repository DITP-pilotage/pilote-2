import {
  acrFromIdToken,
  decoderPayloadJwt,
  ErreurProConnect,
  profilProConnectSchema,
} from "@/server/infrastructure/api/auth/proconnect";

const encoderJwt = (payload: object): string => {
  const enBase64Url = (valeur: string) =>
    Buffer.from(valeur, "utf8").toString("base64url");
  return `${enBase64Url('{"alg":"RS256"}')}.${enBase64Url(JSON.stringify(payload))}.signature`;
};

describe("decoderPayloadJwt", () => {
  it("décode le payload d'un JWT", () => {
    const jwt = encoderJwt({ sub: "abc", email: "agent@exemple.gouv.fr" });

    expect(decoderPayloadJwt({ jwt })).toEqual({
      sub: "abc",
      email: "agent@exemple.gouv.fr",
    });
  });

  it("décode correctement les caractères accentués", () => {
    const jwt = encoderJwt({ sub: "abc", usual_name: "Ézéchiel" });

    expect(decoderPayloadJwt({ jwt })).toEqual({
      sub: "abc",
      usual_name: "Ézéchiel",
    });
  });

  it("lève une erreur explicite si le JWT est malformé", () => {
    expect(() => decoderPayloadJwt({ jwt: "pas-un-jwt" })).toThrow(
      "Réponse userinfo ProConnect malformée",
    );
  });

  it("lève une erreur explicite si le payload n'est pas du JSON", () => {
    const jwt = `${Buffer.from("{}", "utf8").toString("base64url")}.${Buffer.from("pas du json", "utf8").toString("base64url")}.signature`;

    expect(() => decoderPayloadJwt({ jwt })).toThrow(
      "Réponse userinfo ProConnect malformée",
    );
  });
});

describe("profilProConnectSchema", () => {
  it("accepte un profil ProConnect complet", () => {
    const resultat = profilProConnectSchema.safeParse({
      sub: "abc",
      email: "agent@exemple.gouv.fr",
      given_name: "Alice",
      usual_name: "Richard",
    });

    expect(resultat.success).toBe(true);
  });

  it("accepte un profil sans email : le refus est du ressort du callback signIn", () => {
    const resultat = profilProConnectSchema.safeParse({ sub: "abc" });

    expect(resultat.success).toBe(true);
  });

  it("refuse un profil sans sub", () => {
    const resultat = profilProConnectSchema.safeParse({
      email: "agent@exemple.gouv.fr",
    });

    expect(resultat.success).toBe(false);
  });
});

describe("acrFromIdToken", () => {
  it("lit l'acr porté par l'id_token", () => {
    const idToken = encoderJwt({ sub: "abc", acr: "eidas1-mfa" });

    expect(acrFromIdToken({ idToken })).toBe("eidas1-mfa");
  });

  it("renvoie undefined si l'id_token ne porte pas d'acr", () => {
    const idToken = encoderJwt({ sub: "abc" });

    expect(acrFromIdToken({ idToken })).toBeUndefined();
  });

  it("renvoie undefined sans id_token", () => {
    expect(acrFromIdToken({ idToken: undefined })).toBeUndefined();
  });
});

describe("ErreurProConnect", () => {
  it("s'identifie par son nom, seule information qu'Auth.js remonte au logger", () => {
    expect(new ErreurProConnect("boum").name).toBe("ErreurProConnect");
  });

  it("porte le provider dans sa cause, pour distinguer un échec ProConnect d'un échec Keycloak dans le panel", () => {
    expect(new ErreurProConnect("boum").cause).toEqual({
      provider: "proconnect",
    });
  });
});

describe("les échecs de décodage sont des ErreurProConnect", () => {
  it("un JWT malformé", () => {
    expect(() => decoderPayloadJwt({ jwt: "pas-un-jwt" })).toThrow(
      ErreurProConnect,
    );
  });
});
