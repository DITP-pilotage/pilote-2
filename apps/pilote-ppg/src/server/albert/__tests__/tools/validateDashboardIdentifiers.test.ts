import {
  validateDashboardIdentifiers,
  type ChantierContext,
  type IndicateurContext,
} from "@/server/albert/tools/createDashboard";
import type { ComposeDashboardInput } from "@/server/albert/tools/composeDashboard";

describe("validateDashboardIdentifiers", () => {
  it("ne lève pas d'erreur pour un dashboard valide", () => {
    // given
    const output: ComposeDashboardInput = {
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

    // when / then
    expect(() =>
      validateDashboardIdentifiers(
        output,
        ["REG-53"],
        [2025],
        undefined,
        undefined,
      ),
    ).not.toThrow();
  });

  it("lève une erreur pour un territoire_code non autorisé", () => {
    // given
    const output: ComposeDashboardInput = {
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

    // when / then
    expect(() =>
      validateDashboardIdentifiers(
        output,
        ["REG-53"],
        [2025],
        undefined,
        undefined,
      ),
    ).toThrow(/territoire non autorisé : REG-99/);
  });

  it("lève une erreur pour un jalon non autorisé", () => {
    // given
    const output: ComposeDashboardInput = {
      titre: "Cockpit",
      containers: [
        {
          widgets: [
            {
              type: "widget_taux_avancement_territoire",
              territoire_code: "REG-53",
              jalon: 2024,
            },
          ],
        },
      ],
    };

    // when / then
    expect(() =>
      validateDashboardIdentifiers(
        output,
        ["REG-53"],
        [2025],
        undefined,
        undefined,
      ),
    ).toThrow(/jalon non autorisé : 2024/);
  });

  it("lève une erreur quand chantier_id est utilisé sans chantiers fournis", () => {
    // given
    const output: ComposeDashboardInput = {
      titre: "Cockpit",
      containers: [
        {
          widgets: [
            {
              type: "widget_cartographie_meteo",
              maille: "departementale",
              territoire_code: "REG-53",
              chantier_id: "CH-001",
              jalon: 2025,
            },
          ],
        },
      ],
    };

    // when / then
    expect(() =>
      validateDashboardIdentifiers(
        output,
        ["REG-53"],
        [2025],
        undefined,
        undefined,
      ),
    ).toThrow(/chantier_id.*aucun.*fourni/i);
  });

  it("lève une erreur quand chantier_id n'est pas dans la liste autorisée", () => {
    // given
    const chantiers: ChantierContext[] = [{ id: "CH-001", nom: "Chantier 1" }];
    const output: ComposeDashboardInput = {
      titre: "Cockpit",
      containers: [
        {
          widgets: [
            {
              type: "widget_cartographie_meteo",
              maille: "departementale",
              territoire_code: "REG-53",
              chantier_id: "CH-999",
              jalon: 2025,
            },
          ],
        },
      ],
    };

    // when / then
    expect(() =>
      validateDashboardIdentifiers(
        output,
        ["REG-53"],
        [2025],
        chantiers,
        undefined,
      ),
    ).toThrow(/chantier_id non autorisé : CH-999/);
  });

  it("ne lève pas d'erreur pour des widgets sans identifiants", () => {
    // given
    const output: ComposeDashboardInput = {
      titre: "Cockpit",
      containers: [
        {
          widgets: [
            {
              type: "widget_titre_section",
              titre: "Section titre",
            },
          ],
        },
      ],
    };

    // when / then
    expect(() =>
      validateDashboardIdentifiers(
        output,
        ["REG-53"],
        [2025],
        undefined,
        undefined,
      ),
    ).not.toThrow();
  });

  it("ne lève pas d'erreur pour des containers avec widgets valides mixtes", () => {
    // given
    const chantiers: ChantierContext[] = [{ id: "CH-001", nom: "Chantier 1" }];
    const output: ComposeDashboardInput = {
      titre: "Cockpit",
      containers: [
        {
          widgets: [{ type: "widget_titre_section", titre: "Intro" }],
        },
        {
          widgets: [
            {
              type: "widget_taux_avancement_territoire",
              territoire_code: "REG-53",
              jalon: 2025,
            },
            {
              type: "widget_cartographie_meteo",
              maille: "departementale",
              territoire_code: "REG-53",
              chantier_id: "CH-001",
              jalon: 2025,
            },
          ],
        },
      ],
    };

    // when / then
    expect(() =>
      validateDashboardIdentifiers(
        output,
        ["REG-53"],
        [2025],
        chantiers,
        undefined,
      ),
    ).not.toThrow();
  });

  describe("territoire_codes (widgets multi-territoires)", () => {
    it("ne lève pas d'erreur quand tous les territoire_codes sont autorisés", () => {
      // given
      const output: ComposeDashboardInput = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_evolution_taux_avancement",
                indicateur_id: "IND-894",
                chantier_id: "CH-001",
                territoire_codes: ["REG-53", "DEPT-75"],
                jalon: 2025,
              },
            ],
          },
        ],
      };
      const indicateurs: IndicateurContext[] = [
        { id: "IND-894", nom: "Indicateur test", chantier_id: "CH-001" },
      ];

      // when / then
      expect(() =>
        validateDashboardIdentifiers(
          output,
          ["REG-53", "DEPT-75"],
          [2025],
          undefined,
          indicateurs,
        ),
      ).not.toThrow();
    });

    it("lève une erreur quand un territoire_codes n'est pas autorisé", () => {
      // given
      const output: ComposeDashboardInput = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_evolution_taux_avancement",
                indicateur_id: "IND-894",
                chantier_id: "CH-001",
                territoire_codes: ["REG-53", "REG-99"],
                jalon: 2025,
              },
            ],
          },
        ],
      };
      const indicateurs: IndicateurContext[] = [
        { id: "IND-894", nom: "Indicateur test", chantier_id: "CH-001" },
      ];

      // when / then
      expect(() =>
        validateDashboardIdentifiers(
          output,
          ["REG-53"],
          [2025],
          undefined,
          indicateurs,
        ),
      ).toThrow(/territoire non autorisé : REG-99/);
    });
  });

  describe("indicateur_id / chantier_id", () => {
    it("lève une erreur pour un indicateur_id absent de la liste autorisée", () => {
      // given
      const output: ComposeDashboardInput = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_evolution_taux_avancement",
                indicateur_id: "IND-999",
                chantier_id: "CH-001",
                territoire_codes: ["REG-53"],
                jalon: 2025,
              },
            ],
          },
        ],
      };
      const indicateurs: IndicateurContext[] = [
        { id: "IND-894", nom: "Indicateur test", chantier_id: "CH-001" },
      ];

      // when / then
      expect(() =>
        validateDashboardIdentifiers(
          output,
          ["REG-53"],
          [2025],
          undefined,
          indicateurs,
        ),
      ).toThrow(/indicateur_id non autorisé : IND-999/);
    });

    it("lève une erreur pour un indicateur_id utilisé sans indicateurs fournis", () => {
      // given
      const output: ComposeDashboardInput = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_evolution_taux_avancement",
                indicateur_id: "IND-894",
                chantier_id: "CH-001",
                territoire_codes: ["REG-53"],
                jalon: 2025,
              },
            ],
          },
        ],
      };

      // when / then
      expect(() =>
        validateDashboardIdentifiers(
          output,
          ["REG-53"],
          [2025],
          undefined,
          undefined,
        ),
      ).toThrow(/indicateur_id \(IND-894\) alors qu'aucun n'a été fourni/);
    });

    it("lève une erreur pour un chantier_id incohérent avec celui de l'indicateur", () => {
      // given
      const output: ComposeDashboardInput = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_evolution_taux_avancement",
                indicateur_id: "IND-894",
                chantier_id: "CH-AUTRE",
                territoire_codes: ["REG-53"],
                jalon: 2025,
              },
            ],
          },
        ],
      };
      const indicateurs: IndicateurContext[] = [
        { id: "IND-894", nom: "Indicateur test", chantier_id: "CH-001" },
      ];

      // when / then
      expect(() =>
        validateDashboardIdentifiers(
          output,
          ["REG-53"],
          [2025],
          undefined,
          indicateurs,
        ),
      ).toThrow(
        /chantier_id \(CH-AUTRE\) incohérent avec l'indicateur IND-894/,
      );
    });

    it("ne lève pas d'erreur quand indicateur_id et chantier_id correspondent", () => {
      // given
      const output: ComposeDashboardInput = {
        titre: "Cockpit",
        containers: [
          {
            widgets: [
              {
                type: "widget_evolution_valeur_avancement",
                indicateur_id: "IND-894",
                chantier_id: "CH-001",
                territoire_codes: ["REG-53"],
                jalon: 2025,
              },
            ],
          },
        ],
      };
      const indicateurs: IndicateurContext[] = [
        { id: "IND-894", nom: "Indicateur test", chantier_id: "CH-001" },
      ];

      // when / then
      expect(() =>
        validateDashboardIdentifiers(
          output,
          ["REG-53"],
          [2025],
          undefined,
          indicateurs,
        ),
      ).not.toThrow();
    });
  });
});
