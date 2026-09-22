import { autoriserConnexionProConnect } from "@/server/authentification/domain/autoriserConnexionProConnect";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import {
  CompteAuthentification,
  StatutCompte,
} from "@/server/gestion-utilisateur/domain/StatutCompte";

const compte = (
  statut: StatutCompte,
  profilCode: string | null = ProfilEnum.DITP_ADMIN,
): CompteAuthentification => ({ statut, profilCode });

const recupererCompteAvec = (compteRetourne: CompteAuthentification) =>
  vi.fn().mockResolvedValue(compteRetourne);

describe("autoriserConnexionProConnect", () => {
  it("autorise un compte actif", async () => {
    const motif = await autoriserConnexionProConnect({
      email: "agent@exemple.gouv.fr",
      acr: "eidas1-mfa",
      profilsAutorises: null,
      recupererCompte: recupererCompteAvec(compte("actif")),
    });

    expect(motif).toBeNull();
  });

  it("refuse une identité inconnue de PILOTE", async () => {
    const motif = await autoriserConnexionProConnect({
      email: "inconnu@exemple.gouv.fr",
      acr: "eidas1-mfa",
      profilsAutorises: null,
      recupererCompte: recupererCompteAvec(compte("inconnu", null)),
    });

    expect(motif).toBe("compte_inconnu");
  });

  it("refuse un compte désactivé", async () => {
    const motif = await autoriserConnexionProConnect({
      email: "desactive@exemple.gouv.fr",
      acr: "eidas1-mfa",
      profilsAutorises: null,
      recupererCompte: recupererCompteAvec(compte("desactive")),
    });

    expect(motif).toBe("compte_desactive");
  });

  it.each([undefined, null, "", "   "])(
    "refuse une identité sans email exploitable (%p)",
    async (email) => {
      const recupererCompte = recupererCompteAvec(compte("actif"));

      const motif = await autoriserConnexionProConnect({
        email,
        acr: "eidas1-mfa",
        profilsAutorises: null,
        recupererCompte,
      });

      expect(motif).toBe("email_absent");
      expect(recupererCompte).not.toHaveBeenCalled();
    },
  );

  it("normalise l'email avant de chercher le compte", async () => {
    const recupererCompte = recupererCompteAvec(compte("actif"));

    await autoriserConnexionProConnect({
      email: "  Agent.Richard@Exemple.Gouv.FR ",
      acr: "eidas1-mfa",
      profilsAutorises: null,
      recupererCompte,
    });

    expect(recupererCompte).toHaveBeenCalledWith(
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
          profilsAutorises: null,
          recupererCompte: recupererCompteAvec(compte("actif")),
        });

        expect(motif).toBeNull();
      },
    );

    it.each([undefined, null, "", "eidas0", "eidas1"])(
      "refuse une authentification sans second facteur (%p) sans consulter le compte",
      async (acr) => {
        const recupererCompte = recupererCompteAvec(compte("actif"));

        const motif = await autoriserConnexionProConnect({
          email: "agent@exemple.gouv.fr",
          acr,
          profilsAutorises: null,
          recupererCompte,
        });

        expect(motif).toBe("double_authentification_absente");
        expect(recupererCompte).not.toHaveBeenCalled();
      },
    );
  });

  describe("restriction par profil", () => {
    it("autorise un profil figurant dans la liste des profils autorisés", async () => {
      const motif = await autoriserConnexionProConnect({
        email: "admin@exemple.gouv.fr",
        acr: "eidas1-mfa",
        profilsAutorises: [ProfilEnum.DITP_ADMIN],
        recupererCompte: recupererCompteAvec(
          compte("actif", ProfilEnum.DITP_ADMIN),
        ),
      });

      expect(motif).toBeNull();
    });

    it("refuse un profil absent de la liste des profils autorisés", async () => {
      const motif = await autoriserConnexionProConnect({
        email: "equipe.dir.projet@exemple.gouv.fr",
        acr: "eidas1-mfa",
        profilsAutorises: [ProfilEnum.DITP_ADMIN],
        recupererCompte: recupererCompteAvec(
          compte("actif", ProfilEnum.EQUIPE_DIR_PROJET),
        ),
      });

      expect(motif).toBe("profil_non_autorise");
    });

    it("autorise n'importe quel profil quand aucune restriction n'est posée", async () => {
      const motif = await autoriserConnexionProConnect({
        email: "equipe.dir.projet@exemple.gouv.fr",
        acr: "eidas1-mfa",
        profilsAutorises: null,
        recupererCompte: recupererCompteAvec(
          compte("actif", ProfilEnum.EQUIPE_DIR_PROJET),
        ),
      });

      expect(motif).toBeNull();
    });

    it("refuse avant le filtre de profil un compte désactivé, même de profil autorisé", async () => {
      const motif = await autoriserConnexionProConnect({
        email: "admin.desactive@exemple.gouv.fr",
        acr: "eidas1-mfa",
        profilsAutorises: [ProfilEnum.DITP_ADMIN],
        recupererCompte: recupererCompteAvec(
          compte("desactive", ProfilEnum.DITP_ADMIN),
        ),
      });

      expect(motif).toBe("compte_desactive");
    });
  });
});
