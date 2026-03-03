import { $Enums } from "@prisma/client";
import { RapportHebdomadaire } from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";
import {
  Coordinateur,
  TerritoireCoordinateur,
} from "@/server/rapports-hebdomadaires/domain/Coordinateur";
import { CompteActivite } from "@/server/rapports-hebdomadaires/domain/CompteActivite";
import {
  SectionChantier,
  SectionIndicateur,
  SectionTerritoire,
} from "@/server/rapports-hebdomadaires/domain/SectionActiviteChantiers";
import { createBrevoParams } from "@/server/rapports-hebdomadaires/infrastructure/adapters/BrevoEnvoieEmailService";

describe("createBrevoParams", () => {
  const createTerritoireCoordinateur = (
    overrides: Partial<TerritoireCoordinateur> = {},
  ): TerritoireCoordinateur => ({
    code: "REG-11",
    nom: "Île-de-France",
    maille: "REG",
    enfants: [],
    ...overrides,
  });

  const createCoordinateur = (
    overrides: Partial<Coordinateur> = {},
  ): Coordinateur => ({
    id: "coord-1",
    email: "coordinateur@example.com",
    nom: "Dupont",
    prenom: "Jean",
    profil: "COORDINATEUR_REGION",
    territoires: [createTerritoireCoordinateur()],
    ...overrides,
  });

  const createCompteActivite = (
    overrides: Partial<CompteActivite> = {},
  ): CompteActivite => ({
    email: "user@example.com",
    nom: "Martin",
    prenom: "Pierre",
    profil: "PREFET_REGION",
    territoires: [],
    ...overrides,
  });

  const createSectionTerritoire = (
    overrides: Partial<SectionTerritoire> = {},
  ): SectionTerritoire => ({
    code: "DEPT-75",
    nom: "Paris",
    typeValeur: "VALEUR_AVANCEMENT",
    valeur: 50,
    dateValeur: "2025-01-15T10:00:00Z",
    dateEvenement: "2025-01-15T14:30:00Z",
    ...overrides,
  });

  const createSectionIndicateur = (
    overrides: Partial<SectionIndicateur> = {},
  ): SectionIndicateur => ({
    id: "IND-001",
    nom: "Indicateur Test",
    territoires: [createSectionTerritoire()],
    ...overrides,
  });

  const createSectionChantier = (
    overrides: Partial<SectionChantier> = {},
  ): SectionChantier => ({
    id: "CH-001",
    nom: "Chantier Test",
    indicateurs: [createSectionIndicateur()],
    ...overrides,
  });

  const createRapportHebdomadaire = (
    overrides: Partial<RapportHebdomadaire> = {},
  ): RapportHebdomadaire => ({
    id: "rapport-1",
    coordinateur: createCoordinateur(),
    periode: {
      dateDebut: new Date("2025-01-13T09:00:01Z"),
      dateFin: new Date("2025-01-20T09:00:01Z"),
    },
    sectionActiviteComptes: {
      comptesCrees: [],
      comptesDesactives: [],
    },
    chantiers: [],
    statutEnvoi: $Enums.statut_envoi_rapport.CREE,
    dateCreation: new Date(),
    nombreTentatives: 0,
    ...overrides,
  });

  describe("mapping des données du coordinateur", () => {
    it("mappe prenom, nom et territoire", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        coordinateur: createCoordinateur({
          prenom: "Alice",
          nom: "Bernard",
          territoires: [
            createTerritoireCoordinateur({
              code: "REG-11",
              nom: "Île-de-France",
            }),
          ],
        }),
      });

      // When
      const result = createBrevoParams({ rapport });

      // Then
      expect(result.prenom).toBe("Alice");
      expect(result.nom).toBe("Bernard");
      expect(result.territoire).toBe("Île-de-France");
    });

    it("formate le territoire du coordinateur avec le code département", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        coordinateur: createCoordinateur({
          territoires: [
            createTerritoireCoordinateur({
              code: "DEPT-75",
              nom: "Paris",
            }),
          ],
        }),
      });

      // When
      const result = createBrevoParams({ rapport });

      // Then
      expect(result.territoire).toBe("75 - Paris");
    });

    it("joint plusieurs territoires avec une virgule et un espace", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        coordinateur: createCoordinateur({
          territoires: [
            createTerritoireCoordinateur({
              code: "REG-11",
              nom: "Île-de-France",
            }),
            createTerritoireCoordinateur({
              code: "REG-32",
              nom: "Hauts-de-France",
            }),
            createTerritoireCoordinateur({ code: "REG-28", nom: "Normandie" }),
          ],
        }),
      });

      // When
      const result = createBrevoParams({ rapport });

      // Then
      expect(result.territoire).toBe(
        "Île-de-France, Hauts-de-France, Normandie",
      );
    });

    it("joint plusieurs territoires mixtes (départements et régions) avec formatage approprié", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        coordinateur: createCoordinateur({
          territoires: [
            createTerritoireCoordinateur({ code: "DEPT-75", nom: "Paris" }),
            createTerritoireCoordinateur({
              code: "REG-11",
              nom: "Île-de-France",
            }),
            createTerritoireCoordinateur({
              code: "DEPT-92",
              nom: "Hauts-de-Seine",
            }),
          ],
        }),
      });

      // When
      const result = createBrevoParams({ rapport });

      // Then
      expect(result.territoire).toBe(
        "75 - Paris, Île-de-France, 92 - Hauts-de-Seine",
      );
    });
  });

  describe("drapeaux de section", () => {
    it("définit afficherSectionComptes à true quand comptesCrees contient des données", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [createCompteActivite()],
          comptesDesactives: [],
        },
      });

      // When
      const result = createBrevoParams({ rapport });

      // Then
      expect(result.afficherSectionComptes).toBe(true);
    });

    it("définit afficherSectionComptes à true quand comptesDesactives contient des données", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [],
          comptesDesactives: [createCompteActivite()],
        },
      });

      // When
      const result = createBrevoParams({ rapport });

      // Then
      expect(result.afficherSectionComptes).toBe(true);
    });

    it("définit afficherSectionComptes à true quand comptesCrees et comptesDesactives contiennent tous deux des données", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [createCompteActivite()],
          comptesDesactives: [createCompteActivite()],
        },
      });

      // When
      const result = createBrevoParams({ rapport });

      // Then
      expect(result.afficherSectionComptes).toBe(true);
    });

    it("définit afficherSectionComptes à false quand les deux sont vides", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [],
          comptesDesactives: [],
        },
      });

      // When
      const result = createBrevoParams({ rapport });

      // Then
      expect(result.afficherSectionComptes).toBe(false);
    });

    it("définit afficherSectionChantiers à true quand chantiers contient des données", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        chantiers: [createSectionChantier()],
      });

      // When
      const result = createBrevoParams({ rapport });

      // Then
      expect(result.afficherSectionChantiers).toBe(true);
    });

    it("définit afficherSectionChantiers à false quand chantiers est vide", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        chantiers: [],
      });

      // When
      const result = createBrevoParams({ rapport });

      // Then
      expect(result.afficherSectionChantiers).toBe(false);
    });
  });

  describe("compteurs de comptes", () => {
    it("retourne le nombre de comptes créés", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [createCompteActivite(), createCompteActivite()],
          comptesDesactives: [],
        },
      });

      // When
      const result = createBrevoParams({ rapport });

      // Then
      expect(result.nbComptesCrees).toBe(2);
    });

    it("retourne le nombre de comptes désactivés", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [],
          comptesDesactives: [
            createCompteActivite(),
            createCompteActivite(),
            createCompteActivite(),
          ],
        },
      });

      // When
      const result = createBrevoParams({ rapport });

      // Then
      expect(result.nbComptesDesactives).toBe(3);
    });
  });

  describe("formatage des chantiers", () => {
    it("mappe id et nom du chantier correctement", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        chantiers: [
          createSectionChantier({
            id: "CH-123",
            nom: "Chantier Important",
          }),
        ],
      });

      // When
      const result = createBrevoParams({ rapport });

      // Then
      expect(result.chantiers[0].id).toBe("CH-123");
      expect(result.chantiers[0].nom).toBe("Chantier Important");
    });
  });
});
