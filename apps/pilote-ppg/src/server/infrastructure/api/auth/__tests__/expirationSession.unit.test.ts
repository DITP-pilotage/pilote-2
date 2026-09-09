import { sessionExpiree } from "@/server/infrastructure/api/auth/expirationSession";

const MAINTENANT = new Date("2026-09-08T12:00:00Z").getTime();
const IL_Y_A_UNE_HEURE = MAINTENANT - 3_600_000;
const DANS_UNE_HEURE = MAINTENANT + 3_600_000;

describe("sessionExpiree", () => {
  it("considère un access token Keycloak dépassé comme expiré", () => {
    expect(
      sessionExpiree({
        provider: "keycloak",
        accessTokenExpires: IL_Y_A_UNE_HEURE,
        maintenant: MAINTENANT,
      }),
    ).toBe(true);
  });

  it("considère un access token Keycloak encore valide comme non expiré", () => {
    expect(
      sessionExpiree({
        provider: "keycloak",
        accessTokenExpires: DANS_UNE_HEURE,
        maintenant: MAINTENANT,
      }),
    ).toBe(false);
  });

  it("n'expire jamais une session ProConnect : la session PILOTE est autonome", () => {
    expect(
      sessionExpiree({
        provider: "proconnect",
        accessTokenExpires: IL_Y_A_UNE_HEURE,
        maintenant: MAINTENANT,
      }),
    ).toBe(false);
  });

  it("n'expire jamais une session credentials", () => {
    expect(
      sessionExpiree({
        provider: "credentials",
        accessTokenExpires: IL_Y_A_UNE_HEURE,
        maintenant: MAINTENANT,
      }),
    ).toBe(false);
  });
});
