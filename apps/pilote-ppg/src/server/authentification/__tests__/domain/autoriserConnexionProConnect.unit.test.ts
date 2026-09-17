import { autoriserConnexionProConnect } from "@/server/authentification/domain/autoriserConnexionProConnect";
import { StatutCompte } from "@/server/gestion-utilisateur/domain/StatutCompte";

const recupererStatut = (statut: StatutCompte) =>
  vi.fn().mockResolvedValue(statut);

describe("autoriserConnexionProConnect", () => {
  it("autorise un compte actif", async () => {
    const motif = await autoriserConnexionProConnect({
      email: "agent@exemple.gouv.fr",
      acr: "eidas1-mfa",
      recupererStatutCompte: recupererStatut("actif"),
    });

    expect(motif).toBeNull();
  });

  it("refuse une identité inconnue de PILOTE", async () => {
    const motif = await autoriserConnexionProConnect({
      email: "inconnu@exemple.gouv.fr",
      acr: "eidas1-mfa",
      recupererStatutCompte: recupererStatut("inconnu"),
    });

    expect(motif).toBe("compte_inconnu");
  });

  it("refuse un compte désactivé", async () => {
    const motif = await autoriserConnexionProConnect({
      email: "desactive@exemple.gouv.fr",
      acr: "eidas1-mfa",
      recupererStatutCompte: recupererStatut("desactive"),
    });

    expect(motif).toBe("compte_desactive");
  });

  it.each([undefined, null, "", "   "])(
    "refuse une identité sans email exploitable (%p)",
    async (email) => {
      const recupererStatutCompte = recupererStatut("actif");

      const motif = await autoriserConnexionProConnect({
        email,
        acr: "eidas1-mfa",
        recupererStatutCompte,
      });

      expect(motif).toBe("email_absent");
      expect(recupererStatutCompte).not.toHaveBeenCalled();
    },
  );

  it("normalise l'email avant de chercher le compte", async () => {
    const recupererStatutCompte = recupererStatut("actif");

    await autoriserConnexionProConnect({
      email: "  Agent.Richard@Exemple.Gouv.FR ",
      acr: "eidas1-mfa",
      recupererStatutCompte,
    });

    expect(recupererStatutCompte).toHaveBeenCalledWith(
      "agent.richard@exemple.gouv.fr",
    );
  });

  describe("double authentification", () => {
    it.each(["eidas0-mfa", "eidas1-mfa", "eidas2", "eidas3"])(
      "autorise un compte actif authentifié en %s",
      async (acr) => {
        const motif = await autoriserConnexionProConnect({
          email: "agent@exemple.gouv.fr",
          acr,
          recupererStatutCompte: recupererStatut("actif"),
        });

        expect(motif).toBeNull();
      },
    );

    it.each([undefined, null, "", "eidas0", "eidas1"])(
      "refuse une authentification sans second facteur (%p) sans consulter le compte",
      async (acr) => {
        const recupererStatutCompte = recupererStatut("actif");

        const motif = await autoriserConnexionProConnect({
          email: "agent@exemple.gouv.fr",
          acr,
          recupererStatutCompte,
        });

        expect(motif).toBe("double_authentification_absente");
        expect(recupererStatutCompte).not.toHaveBeenCalled();
      },
    );
  });
});
