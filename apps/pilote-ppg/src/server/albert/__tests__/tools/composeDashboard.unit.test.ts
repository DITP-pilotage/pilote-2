import {
  composeDashboardInputSchema,
  createComposeDashboardTool,
} from "@/server/albert/tools/composeDashboard";
import type { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";

const buildHabilitations = (territoires: string[]): Habilitations => ({
  lecture: { chantiers: [], territoires, périmètres: [] },
  saisieCommentaire: { chantiers: [], territoires: [], périmètres: [] },
  saisieIndicateur: { chantiers: [], territoires: [], périmètres: [] },
  responsabilite: { chantiers: [], territoires: [], périmètres: [] },
  gestionUtilisateur: { chantiers: [], territoires: [], périmètres: [] },
});

const buildTool = (territoires: string[]) =>
  createComposeDashboardTool()({
    habilitations: buildHabilitations(territoires),
  });

const executeTool = async (
  territoires: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any,
) => {
  const tool = buildTool(territoires);
  return tool.execute!(input, {
    toolCallId: "test",
    messages: [],
  });
};

describe("composeDashboardInputSchema", () => {
  describe("widgets KPI atomiques", () => {
    test("accepte widget_taux_avancement_territoire minimal", () => {
      // Given
      const input = {
        titre: "Cockpit Bretagne",
        containers: [
          {
            widgets: [
              {
                type: "widget_taux_avancement_territoire",
                territoire_code: "REG-53",
                jalon: 2025,
              },
            ],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(true);
    });

    test("accepte widget_mediane_avancement_territoire avec width 2", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_mediane_avancement_territoire",
                territoire_code: "NAT-FR",
                jalon: 2024,
                width: 2,
              },
            ],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(true);
    });

    test("accepte widget_nombre_chantiers_en_retard", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_nombre_chantiers_en_retard",
                territoire_code: "DEPT-75",
                jalon: 2025,
              },
            ],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(true);
    });
  });

  describe("widget valeurs remarquables, listes et tableau", () => {
    test("accepte widget_valeurs_remarquables_avancement avec width 4", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_valeurs_remarquables_avancement",
                territoire_code: "REG-53",
                jalon: 2025,
                width: 4,
              },
            ],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(true);
    });

    test("accepte widget_tableau_indicateurs_chantier", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_tableau_indicateurs_chantier",
                chantier_id: "CH-001",
                territoire_code: "NAT-FR",
                jalon: 2025,
              },
            ],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(true);
    });

    test("accepte widget_liste_chantiers_en_retard et widget_liste_chantiers_en_difficulte cote a cote", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_liste_chantiers_en_retard",
                territoire_code: "REG-53",
                jalon: 2025,
                width: 2,
              },
              {
                type: "widget_liste_chantiers_en_difficulte",
                territoire_code: "REG-53",
                jalon: 2025,
                width: 2,
              },
            ],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(true);
    });
  });

  describe("widgets cartographie", () => {
    test("accepte widget_cartographie_taux_avancement avec chantier_ids", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_cartographie_taux_avancement",
                maille: "regionale",
                territoire_code: "NAT-FR",
                jalon: 2025,
                chantier_ids: ["CH-001", "CH-002"],
              },
            ],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(true);
    });

    test("rejette widget_cartographie_taux_avancement avec chantier_ids vide", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_cartographie_taux_avancement",
                maille: "regionale",
                territoire_code: "NAT-FR",
                jalon: 2025,
                chantier_ids: [],
              },
            ],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(false);
    });

    test("accepte widget_cartographie_meteo", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_cartographie_meteo",
                maille: "departementale",
                territoire_code: "NAT-FR",
                chantier_id: "CH-001",
                jalon: 2025,
              },
            ],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(true);
    });
  });

  describe("widget_titre_section", () => {
    test("accepte widget_titre_section avec titre seul", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_titre_section",
                titre: "Vue d'ensemble",
              },
            ],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(true);
    });

    test("accepte widget_titre_section avec titre et description", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_titre_section",
                titre: "Synthèse",
                description: "Vue compacte des indicateurs clés du territoire.",
              },
            ],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(true);
    });
  });

  describe("validation stricte", () => {
    test("rejette un widget avec un type inconnu", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_inexistant",
                territoire_code: "REG-53",
                jalon: 2025,
              },
            ],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(false);
    });

    test("rejette un widget avec un champ inconnu (.strict)", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_taux_avancement_territoire",
                territoire_code: "REG-53",
                jalon: 2025,
                champ_inconnu: "valeur",
              },
            ],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(false);
    });

    test("rejette un container vide", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [{ widgets: [] }],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(false);
    });

    test("rejette un dashboard sans titre", () => {
      // Given
      const input = {
        containers: [
          {
            widgets: [
              {
                type: "widget_taux_avancement_territoire",
                territoire_code: "REG-53",
                jalon: 2025,
              },
            ],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(false);
    });
  });
});

describe("createComposeDashboardTool execute", () => {
  describe("habilitations territoriales", () => {
    test("rejette un widget dont le territoire_code n'est pas dans les habilitations en lecture", async () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_taux_avancement_territoire",
                territoire_code: "REG-99",
                jalon: 2025,
              },
            ],
          },
        ],
      };

      // When / Then
      await expect(executeTool(["REG-53"], input)).rejects.toThrow(
        /Accès non autorisé au territoire REG-99/,
      );
    });

    test("accepte un widget dont le territoire_code est habilité", async () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_taux_avancement_territoire",
                territoire_code: "REG-53",
                jalon: 2025,
              },
            ],
          },
        ],
      };

      // When
      const result = await executeTool(["REG-53"], input);

      // Then
      expect(result).toEqual({
        titre: "Cockpit",
        containers: input.containers,
        _output_instructions: expect.any(String),
      });
    });
  });

  describe("linter anti-chiffres sur widget_titre_section", () => {
    test("rejette un titre contenant un pourcentage", async () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_titre_section",
                titre: "TA 45%",
              },
            ],
          },
        ],
      };

      // When / Then
      await expect(executeTool([], input)).rejects.toThrow(
        /widget_titre_section ne doit contenir aucune valeur chiffrée \("45%"\)/,
      );
    });

    test("rejette une description contenant des points", async () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_titre_section",
                titre: "Synthèse",
                description: "Écart de 12 points par rapport à la médiane.",
              },
            ],
          },
        ],
      };

      // When / Then
      await expect(executeTool([], input)).rejects.toThrow(
        /widget_titre_section ne doit contenir aucune valeur chiffrée \("12 points"\)/,
      );
    });

    test("accepte un titre sans valeur chiffrée", async () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_titre_section",
                titre: "Vue d'ensemble du territoire",
                description: "Synthèse des principaux indicateurs.",
              },
            ],
          },
        ],
      };

      // When
      const result = await executeTool([], input);

      // Then
      expect(result).toEqual({
        titre: "Cockpit",
        containers: input.containers,
        _output_instructions: expect.any(String),
      });
    });
  });

  describe("retour identité", () => {
    test("renvoie les containers à l'identique pour un dashboard valide complet", async () => {
      // Given
      const input = {
        titre: "Cockpit Bretagne",
        containers: [
          {
            widgets: [
              {
                type: "widget_titre_section",
                titre: "Synthèse Bretagne",
              },
            ],
          },
          {
            widgets: [
              {
                type: "widget_taux_avancement_territoire",
                territoire_code: "REG-53",
                jalon: 2025,
              },
              {
                type: "widget_nombre_chantiers_en_retard",
                territoire_code: "REG-53",
                jalon: 2025,
              },
              {
                type: "widget_valeurs_remarquables_avancement",
                territoire_code: "REG-53",
                jalon: 2025,
              },
            ],
          },
          {
            widgets: [
              {
                type: "widget_cartographie_taux_avancement",
                maille: "departementale",
                territoire_code: "REG-53",
                jalon: 2025,
                chantier_ids: ["CH-001"],
              },
            ],
          },
        ],
      };

      // When
      const result = await executeTool(["REG-53"], input);

      // Then
      expect(result).toEqual({
        titre: "Cockpit Bretagne",
        containers: input.containers,
        _output_instructions: expect.any(String),
      });
    });
  });
});
