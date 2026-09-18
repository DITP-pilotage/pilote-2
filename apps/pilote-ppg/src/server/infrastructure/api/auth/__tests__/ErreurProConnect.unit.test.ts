import { ErreurProConnect } from "@/server/infrastructure/api/auth/ErreurProConnect";

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
