import {
  calculerDateExpiration,
  determinerTypeAction,
  initSuivi,
  saveNewPassword,
  SuiviPasswordAdmin,
} from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";

describe("SuiviPasswordAdmin", () => {
  const creerSuivi = (
    overrides: Partial<SuiviPasswordAdmin> = {},
  ): SuiviPasswordAdmin => ({
    utilisateurId: "utilisateur-id",
    dateDernierChangement: new Date("2026-04-01T10:00:00Z"),
    dateExpiration: new Date("2026-10-01T10:00:00Z"),
    datePremiereRelance: null,
    dateDeuxiemeRelance: null,
    dateExpirationForcee: null,
    ...overrides,
  });

  describe("calculerDateExpiration", () => {
    it("ajoute 6 mois à la date du dernier changement", () => {
      // When
      const resultat = calculerDateExpiration({
        dateDernierChangement: new Date("2026-04-01T10:00:00Z"),
        aujourdHui: new Date("2026-04-02T10:00:00Z"),
      });

      // Then
      expect(resultat).toEqual(new Date("2026-10-01T10:00:00Z"));
    });

    it("repousse l'expiration à 30 jours quand le mot de passe est déjà trop ancien", () => {
      // When
      const resultat = calculerDateExpiration({
        dateDernierChangement: new Date("2024-01-01T10:00:00Z"),
        aujourdHui: new Date("2026-10-01T10:00:00Z"),
      });

      // Then
      expect(resultat).toEqual(new Date("2026-10-31T10:00:00Z"));
    });

    it("repousse l'expiration à 30 jours quand elle tombe dans moins de 30 jours", () => {
      // When
      const resultat = calculerDateExpiration({
        dateDernierChangement: new Date("2026-04-10T10:00:00Z"),
        aujourdHui: new Date("2026-10-01T10:00:00Z"),
      });

      // Then
      expect(resultat).toEqual(new Date("2026-10-31T10:00:00Z"));
    });

    it("conserve l'expiration quand elle tombe exactement dans 30 jours", () => {
      // When
      const resultat = calculerDateExpiration({
        dateDernierChangement: new Date("2026-04-30T10:00:00Z"),
        aujourdHui: new Date("2026-09-30T10:00:00Z"),
      });

      // Then
      expect(resultat).toEqual(new Date("2026-10-30T10:00:00Z"));
    });
  });

  describe("initSuivi", () => {
    it("crée un suivi sans relance ni expiration forcée", () => {
      // When
      const resultat = initSuivi({
        utilisateurId: "utilisateur-id",
        dateDernierChangement: new Date("2026-04-01T10:00:00Z"),
        aujourdHui: new Date("2026-04-02T10:00:00Z"),
      });

      // Then
      expect(resultat).toEqual({
        utilisateurId: "utilisateur-id",
        dateDernierChangement: new Date("2026-04-01T10:00:00Z"),
        dateExpiration: new Date("2026-10-01T10:00:00Z"),
        datePremiereRelance: null,
        dateDeuxiemeRelance: null,
        dateExpirationForcee: null,
      });
    });
  });

  describe("saveNewPassword", () => {
    it("repart sur un nouveau cycle et efface les relances et l'expiration forcée", () => {
      // Given
      const suivi = creerSuivi({
        datePremiereRelance: new Date("2026-09-01T10:00:00Z"),
        dateDeuxiemeRelance: new Date("2026-09-24T10:00:00Z"),
        dateExpirationForcee: new Date("2026-10-01T10:00:00Z"),
      });

      // When
      const resultat = saveNewPassword({
        suivi,
        dateDernierChangement: new Date("2026-10-02T10:00:00Z"),
        aujourdHui: new Date("2026-10-03T10:00:00Z"),
      });

      // Then
      expect(resultat).toEqual({
        utilisateurId: "utilisateur-id",
        dateDernierChangement: new Date("2026-10-02T10:00:00Z"),
        dateExpiration: new Date("2027-04-02T10:00:00Z"),
        datePremiereRelance: null,
        dateDeuxiemeRelance: null,
        dateExpirationForcee: null,
      });
    });
  });

  describe("determinerTypeAction", () => {
    it("ne retourne rien à plus de 30 jours de l'expiration", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi(),
        aujourdHui: new Date("2026-08-31T10:00:00Z"),
      });

      // Then
      expect(resultat).toBeNull();
    });

    it("retourne PREMIERE_RELANCE à J-30", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi(),
        aujourdHui: new Date("2026-09-01T10:00:00Z"),
      });

      // Then
      expect(resultat).toBe("PREMIERE_RELANCE");
    });

    it("ne retourne rien entre J-30 et J-7 quand la première relance est envoyée", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi({
          datePremiereRelance: new Date("2026-09-01T10:00:00Z"),
        }),
        aujourdHui: new Date("2026-09-15T10:00:00Z"),
      });

      // Then
      expect(resultat).toBeNull();
    });

    it("retourne DEUXIEME_RELANCE à J-7", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi({
          datePremiereRelance: new Date("2026-09-01T10:00:00Z"),
        }),
        aujourdHui: new Date("2026-09-24T10:00:00Z"),
      });

      // Then
      expect(resultat).toBe("DEUXIEME_RELANCE");
    });

    it("préfère DEUXIEME_RELANCE à PREMIERE_RELANCE quand les deux sont dues", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi(),
        aujourdHui: new Date("2026-09-25T10:00:00Z"),
      });

      // Then
      expect(resultat).toBe("DEUXIEME_RELANCE");
    });

    it("ne renvoie pas PREMIERE_RELANCE une fois le seuil J-7 franchi", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi({
          dateDeuxiemeRelance: new Date("2026-09-24T10:00:00Z"),
        }),
        aujourdHui: new Date("2026-09-25T10:00:00Z"),
      });

      // Then
      expect(resultat).toBeNull();
    });

    it("retourne EXPIRATION le jour de l'expiration", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi({
          datePremiereRelance: new Date("2026-09-01T10:00:00Z"),
          dateDeuxiemeRelance: new Date("2026-09-24T10:00:00Z"),
        }),
        aujourdHui: new Date("2026-10-01T10:00:00Z"),
      });

      // Then
      expect(resultat).toBe("EXPIRATION");
    });

    it("préfère EXPIRATION aux relances quand tout est dû", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi(),
        aujourdHui: new Date("2026-10-05T10:00:00Z"),
      });

      // Then
      expect(resultat).toBe("EXPIRATION");
    });

    it("ne retourne rien après l'expiration forcée", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi({
          dateExpirationForcee: new Date("2026-10-01T10:00:00Z"),
        }),
        aujourdHui: new Date("2026-10-15T10:00:00Z"),
      });

      // Then
      expect(resultat).toBeNull();
    });
  });
});
