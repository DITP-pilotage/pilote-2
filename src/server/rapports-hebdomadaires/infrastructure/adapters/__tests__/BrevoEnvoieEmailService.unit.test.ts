import { $Enums } from "@prisma/client";
import { RapportHebdomadaire } from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";
import {
  Coordinateur,
  TerritoireCoordinateur,
} from "@/server/rapports-hebdomadaires/domain/Coordinateur";
import {
  CompteActivite,
  TerritoireCompte,
} from "@/server/rapports-hebdomadaires/domain/CompteActivite";
import {
  SectionChantier,
  SectionIndicateur,
  SectionTerritoire,
} from "@/server/rapports-hebdomadaires/domain/SectionActiviteChantiersVA";
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
    chantiers: [],
    perimetres: [],
    ...overrides,
  });

  const createTerritoireCompte = (
    overrides: Partial<TerritoireCompte> = {},
  ): TerritoireCompte => ({
    code: "DEPT-75",
    nom: "Paris",
    maille: "DEPT",
    enfants: [],
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
    valeurAvancement: 50,
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
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

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
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

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
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

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
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.territoire).toBe(
        "75 - Paris, Île-de-France, 92 - Hauts-de-Seine",
      );
    });
  });

  describe("drapeaux de section", () => {
    it("définit afficherComptesCrees à true quand comptesCrees contient des données", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [createCompteActivite()],
          comptesDesactives: [],
        },
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.afficherComptesCrees).toBe(true);
    });

    it("définit afficherComptesCrees à false quand comptesCrees est vide", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [],
          comptesDesactives: [],
        },
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.afficherComptesCrees).toBe(false);
    });

    it("définit afficherComptesDesactives à true quand comptesDesactives contient des données", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [],
          comptesDesactives: [createCompteActivite()],
        },
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.afficherComptesDesactives).toBe(true);
    });

    it("définit afficherComptesDesactives à false quand comptesDesactives est vide", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [],
          comptesDesactives: [],
        },
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.afficherComptesDesactives).toBe(false);
    });

    it("définit afficherSectionComptes à true quand comptesCrees contient des données", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [createCompteActivite()],
          comptesDesactives: [],
        },
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

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
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

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
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

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
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.afficherSectionComptes).toBe(false);
    });

    it("définit afficherSectionChantiersVA à true quand chantiers contient des données", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        chantiers: [createSectionChantier()],
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.afficherSectionChantiersVA).toBe(true);
    });

    it("définit afficherSectionChantiersVA à false quand chantiers est vide", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        chantiers: [],
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.afficherSectionChantiersVA).toBe(false);
    });
  });

  describe("mapping des profils", () => {
    it("mappe le code profil vers le libellé en utilisant profilsMap", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [
            createCompteActivite({
              profil: "PREFET_REGION",
            }),
          ],
          comptesDesactives: [],
        },
      });
      const profilsMap = new Map<string, string>([
        ["PREFET_REGION", "Préfet de région"],
      ]);

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.comptesCrees[0].profil).toBe("Préfet de région");
    });

    it("utilise le code comme valeur par défaut quand il n'est pas dans profilsMap", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [
            createCompteActivite({
              profil: "UNKNOWN_PROFILE",
            }),
          ],
          comptesDesactives: [],
        },
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.comptesCrees[0].profil).toBe("UNKNOWN_PROFILE");
    });

    it("mappe les profils pour comptesDesactives", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [],
          comptesDesactives: [
            createCompteActivite({
              profil: "COORDINATEUR_REGION",
            }),
          ],
        },
      });
      const profilsMap = new Map<string, string>([
        ["COORDINATEUR_REGION", "Coordinateur de région"],
      ]);

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.comptesDesactives[0].profil).toBe("Coordinateur de région");
    });
  });

  describe("formatage des comptes", () => {
    it("mappe tous les champs correctement pour comptesCrees", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [
            createCompteActivite({
              nom: "Dupont",
              prenom: "Alice",
              email: "alice.dupont@example.com",
              profil: "PREFET_REGION",
              territoires: [
                createTerritoireCompte({
                  code: "REG-11",
                  nom: "Île-de-France",
                }),
              ],
            }),
          ],
          comptesDesactives: [],
        },
      });
      const profilsMap = new Map<string, string>([
        ["PREFET_REGION", "Préfet de région"],
      ]);

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.comptesCrees).toEqual([
        {
          nom: "Dupont",
          prenom: "Alice",
          email: "alice.dupont@example.com",
          profil: "Préfet de région",
          territoire: "Île-de-France",
        },
      ]);
    });

    it("formate le territoire avec le code département pour comptesCrees", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [
            createCompteActivite({
              territoires: [
                createTerritoireCompte({
                  code: "DEPT-75",
                  nom: "Paris",
                }),
              ],
            }),
          ],
          comptesDesactives: [],
        },
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.comptesCrees[0].territoire).toBe("75 - Paris");
    });

    it("mappe tous les champs correctement pour comptesDesactives", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [],
          comptesDesactives: [
            createCompteActivite({
              nom: "Martin",
              prenom: "Bob",
              email: "bob.martin@example.com",
              profil: "COORDINATEUR_DEPARTEMENT",
              territoires: [
                createTerritoireCompte({
                  code: "DEPT-75",
                  nom: "Paris",
                }),
              ],
            }),
          ],
        },
      });
      const profilsMap = new Map<string, string>([
        ["COORDINATEUR_DEPARTEMENT", "Coordinateur de département"],
      ]);

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.comptesDesactives).toEqual([
        {
          nom: "Martin",
          prenom: "Bob",
          email: "bob.martin@example.com",
          profil: "Coordinateur de département",
          territoire: "75 - Paris",
        },
      ]);
    });

    it("formate le territoire avec le code département pour comptesDesactives", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [],
          comptesDesactives: [
            createCompteActivite({
              territoires: [
                createTerritoireCompte({
                  code: "DEPT-92",
                  nom: "Hauts-de-Seine",
                }),
              ],
            }),
          ],
        },
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.comptesDesactives[0].territoire).toBe(
        "92 - Hauts-de-Seine",
      );
    });

    it("joint plusieurs territoires avec une virgule et un espace", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [
            createCompteActivite({
              territoires: [
                createTerritoireCompte({ code: "DEPT-75", nom: "Paris" }),
                createTerritoireCompte({
                  code: "DEPT-92",
                  nom: "Hauts-de-Seine",
                }),
                createTerritoireCompte({
                  code: "DEPT-94",
                  nom: "Val-de-Marne",
                }),
              ],
            }),
          ],
          comptesDesactives: [],
        },
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.comptesCrees[0].territoire).toBe(
        "75 - Paris, 92 - Hauts-de-Seine, 94 - Val-de-Marne",
      );
    });

    it("joint plusieurs territoires mixtes avec formatage approprié pour comptesCrees", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [
            createCompteActivite({
              territoires: [
                createTerritoireCompte({ code: "DEPT-75", nom: "Paris" }),
                createTerritoireCompte({
                  code: "REG-11",
                  nom: "Île-de-France",
                }),
              ],
            }),
          ],
          comptesDesactives: [],
        },
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.comptesCrees[0].territoire).toBe(
        "75 - Paris, Île-de-France",
      );
    });

    it("retourne undefined pour territoire quand il est vide", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        sectionActiviteComptes: {
          comptesCrees: [
            createCompteActivite({
              territoires: [],
            }),
          ],
          comptesDesactives: [],
        },
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.comptesCrees[0].territoire).toBeUndefined();
    });
  });

  describe("formatage des chantiers VA", () => {
    it("formate valeurApres entière en chaîne sans décimale", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        chantiers: [
          createSectionChantier({
            indicateurs: [
              createSectionIndicateur({
                territoires: [
                  createSectionTerritoire({
                    valeurAvancement: 42,
                  }),
                ],
              }),
            ],
          }),
        ],
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.chantiers[0].indicateurs[0].territoires[0].valeur).toBe(
        "42",
      );
    });

    it("formate valeurApres décimale avec une décimale", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        chantiers: [
          createSectionChantier({
            indicateurs: [
              createSectionIndicateur({
                territoires: [
                  createSectionTerritoire({
                    valeurAvancement: 42.567,
                  }),
                ],
              }),
            ],
          }),
        ],
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.chantiers[0].indicateurs[0].territoires[0].valeur).toBe(
        "42.6",
      );
    });

    it("affiche un tiret quand valeurApres est null", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        chantiers: [
          createSectionChantier({
            indicateurs: [
              createSectionIndicateur({
                territoires: [
                  createSectionTerritoire({
                    valeurAvancement: null,
                  }),
                ],
              }),
            ],
          }),
        ],
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.chantiers[0].indicateurs[0].territoires[0].valeur).toBe(
        "-",
      );
    });

    it("formate dateChangement dans la locale fr-FR", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        chantiers: [
          createSectionChantier({
            indicateurs: [
              createSectionIndicateur({
                territoires: [
                  createSectionTerritoire({
                    dateValeur: "2025-01-15T10:00:00Z",
                  }),
                ],
              }),
            ],
          }),
        ],
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(
        result.chantiers[0].indicateurs[0].territoires[0].date_indicateur,
      ).toBe("15/01/2025");
    });

    it("formate date_modification sans l'heure", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        chantiers: [
          createSectionChantier({
            indicateurs: [
              createSectionIndicateur({
                territoires: [
                  createSectionTerritoire({
                    dateEvenement: "2025-01-15T14:30:45Z",
                  }),
                ],
              }),
            ],
          }),
        ],
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(
        result.chantiers[0].indicateurs[0].territoires[0].date_modification,
      ).toBe("15/01/2025");
    });

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
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.chantiers[0].id).toBe("CH-123");
      expect(result.chantiers[0].nom).toBe("Chantier Important");
    });

    it("mappe id et nom de l'indicateur correctement", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        chantiers: [
          createSectionChantier({
            indicateurs: [
              createSectionIndicateur({
                id: "IND-456",
                nom: "Indicateur de suivi",
              }),
            ],
          }),
        ],
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.chantiers[0].indicateurs[0].id).toBe("IND-456");
      expect(result.chantiers[0].indicateurs[0].nom).toBe(
        "Indicateur de suivi",
      );
    });

    it("mappe le nom du territoire correctement", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        chantiers: [
          createSectionChantier({
            indicateurs: [
              createSectionIndicateur({
                territoires: [
                  createSectionTerritoire({
                    code: "DEPT-75",
                    nom: "Paris",
                  }),
                ],
              }),
            ],
          }),
        ],
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.chantiers[0].indicateurs[0].territoires[0].nom).toBe(
        "75 - Paris",
      );
    });

    it("formate le nom du territoire pour un département", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        chantiers: [
          createSectionChantier({
            indicateurs: [
              createSectionIndicateur({
                territoires: [
                  createSectionTerritoire({
                    code: "DEPT-92",
                    nom: "Hauts-de-Seine",
                  }),
                ],
              }),
            ],
          }),
        ],
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.chantiers[0].indicateurs[0].territoires[0].nom).toBe(
        "92 - Hauts-de-Seine",
      );
    });

    it("formate le nom du territoire pour une région", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        chantiers: [
          createSectionChantier({
            indicateurs: [
              createSectionIndicateur({
                territoires: [
                  createSectionTerritoire({
                    code: "REG-11",
                    nom: "Île-de-France",
                  }),
                ],
              }),
            ],
          }),
        ],
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.chantiers[0].indicateurs[0].territoires[0].nom).toBe(
        "Île-de-France",
      );
    });

    it("définit type_indicateur à va", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        chantiers: [createSectionChantier()],
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(
        result.chantiers[0].indicateurs[0].territoires[0].type_indicateur,
      ).toBe("va");
    });

    it("gère plusieurs chantiers avec plusieurs indicateurs et territoires", () => {
      // Given
      const rapport = createRapportHebdomadaire({
        chantiers: [
          createSectionChantier({
            id: "CH-001",
            nom: "Chantier 1",
            indicateurs: [
              createSectionIndicateur({
                id: "IND-001",
                nom: "Indicateur 1",
                territoires: [
                  createSectionTerritoire({
                    code: "DEPT-75",
                    nom: "Paris",
                    valeurAvancement: 10,
                  }),
                  createSectionTerritoire({
                    code: "DEPT-92",
                    nom: "Hauts-de-Seine",
                    valeurAvancement: 20.5,
                  }),
                ],
              }),
              createSectionIndicateur({
                id: "IND-002",
                nom: "Indicateur 2",
                territoires: [
                  createSectionTerritoire({
                    code: "DEPT-75",
                    nom: "Paris",
                    valeurAvancement: null,
                  }),
                ],
              }),
            ],
          }),
          createSectionChantier({
            id: "CH-002",
            nom: "Chantier 2",
            indicateurs: [
              createSectionIndicateur({
                id: "IND-003",
                nom: "Indicateur 3",
                territoires: [
                  createSectionTerritoire({
                    code: "DEPT-93",
                    nom: "Seine-Saint-Denis",
                    valeurAvancement: 100,
                  }),
                ],
              }),
            ],
          }),
        ],
      });
      const profilsMap = new Map<string, string>();

      // When
      const result = createBrevoParams({ profilsMap, rapport });

      // Then
      expect(result.chantiers).toHaveLength(2);
      expect(result.chantiers[0].indicateurs).toHaveLength(2);
      expect(result.chantiers[0].indicateurs[0].territoires).toHaveLength(2);
      expect(result.chantiers[0].indicateurs[0].territoires[0].valeur).toBe(
        "10",
      );
      expect(result.chantiers[0].indicateurs[0].territoires[1].valeur).toBe(
        "20.5",
      );
      expect(result.chantiers[0].indicateurs[1].territoires[0].valeur).toBe(
        "-",
      );
      expect(result.chantiers[1].indicateurs[0].territoires[0].valeur).toBe(
        "100",
      );
    });
  });
});
