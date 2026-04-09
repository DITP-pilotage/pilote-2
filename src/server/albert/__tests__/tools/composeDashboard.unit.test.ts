import { composeDashboardInputSchema } from "@/server/albert/tools/composeDashboard";

describe("composeDashboardInputSchema", () => {
  describe("dashboard valide", () => {
    test("accepte un dashboard avec un container et un kpi_card minimal", () => {
      // Given
      const input = {
        titre: "Cockpit Bretagne",
        containers: [
          {
            widgets: [
              {
                type: "kpi_card",
                metric: "ta_global",
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

    test("accepte un container avec 4 kpi_card homogènes", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "kpi_card",
                metric: "ta_global",
                territoire_code: "REG-53",
                jalon: 2025,
              },
              {
                type: "kpi_card",
                metric: "mediane",
                territoire_code: "REG-53",
                jalon: 2025,
              },
              {
                type: "kpi_card",
                metric: "nb_chantiers_en_retard",
                territoire_code: "REG-53",
                jalon: 2025,
              },
              {
                type: "kpi_card",
                metric: "ta_global",
                territoire_code: "DEPT-35",
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

    test("accepte un container avec un kpi_card et un filler (row_group compatible)", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "kpi_card",
                metric: "ta_global",
                territoire_code: "REG-53",
                jalon: 2025,
              },
              {
                type: "filler",
                width: 9,
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

    test("accepte un texte_section solo dans un container", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "texte_section",
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

    test("accepte un texte_section avec titre et description", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "texte_section",
                titre: "Alertes",
                description:
                  "Chantiers nécessitant une attention particulière.",
                width: 6,
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

    test("accepte un stack de plusieurs containers", () => {
      // Given
      const input = {
        titre: "Cockpit stack",
        containers: [
          {
            widgets: [{ type: "texte_section", titre: "KPIs" }],
          },
          {
            widgets: [
              {
                type: "kpi_card",
                metric: "ta_global",
                territoire_code: "REG-53",
                jalon: 2025,
              },
            ],
          },
          {
            widgets: [
              {
                type: "tableau_indicateurs",
                chantier_id: "CH-001",
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
  });

  describe("dashboard invalide", () => {
    test("rejette un container mélangeant kpi et tableau (row_group conflict)", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "kpi_card",
                metric: "ta_global",
                territoire_code: "REG-53",
                jalon: 2025,
              },
              {
                type: "tableau_indicateurs",
                chantier_id: "CH-001",
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

    test("rejette un container mélangeant kpi et liste_chantiers_alerte", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "kpi_card",
                metric: "ta_global",
                territoire_code: "REG-53",
                jalon: 2025,
              },
              {
                type: "liste_chantiers_alerte",
                territoire_code: "REG-53",
                type_alerte: "retard",
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

    test("rejette un container composé uniquement de fillers", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              { type: "filler", width: 6 },
              { type: "filler", width: 6 },
            ],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(false);
    });

    test("rejette un dashboard avec 0 container", () => {
      // Given
      const input = {
        titre: "Cockpit vide",
        containers: [],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(false);
    });

    test("rejette un container avec 0 widget", () => {
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

    test("rejette un kpi_card sans metric", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "kpi_card",
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

    test("rejette un kpi_card avec une metric inconnue", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "kpi_card",
                metric: "valeur_inconnue",
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

    test("rejette un kpi_card avec width=12 (hors allowed_widths)", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "kpi_card",
                metric: "ta_global",
                territoire_code: "REG-53",
                jalon: 2025,
                width: 12,
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

    test("rejette un tableau_indicateurs avec width=6 (seul 12 autorisé)", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "tableau_indicateurs",
                chantier_id: "CH-001",
                territoire_code: "REG-53",
                jalon: 2025,
                width: 6,
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

    test("rejette un type_alerte inconnu", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "liste_chantiers_alerte",
                territoire_code: "REG-53",
                type_alerte: "compromis",
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

    test("rejette un dashboard sans titre", () => {
      // Given
      const input = {
        containers: [
          {
            widgets: [
              {
                type: "kpi_card",
                metric: "ta_global",
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

    test("rejette un widget avec un type inconnu", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [{ type: "bar_chart_libre", territoire_code: "REG-53" }],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(false);
    });

    test("rejette un texte_section sans titre", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [{ type: "texte_section", description: "Sans titre" }],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(false);
    });

    test("rejette un filler sans width", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "kpi_card",
                metric: "ta_global",
                territoire_code: "REG-53",
                jalon: 2025,
              },
              { type: "filler" },
            ],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(false);
    });

    test("rejette un filler avec une largeur hors enum", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "kpi_card",
                metric: "ta_global",
                territoire_code: "REG-53",
                jalon: 2025,
              },
              { type: "filler", width: 5 },
            ],
          },
        ],
      };

      // When
      const result = composeDashboardInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(false);
    });

    test("rejette un jalon hors bornes", () => {
      // Given
      const input = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "kpi_card",
                metric: "ta_global",
                territoire_code: "REG-53",
                jalon: 2010,
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
