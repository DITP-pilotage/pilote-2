import {
  validateDashboardIdentifiers,
  type ChantierContext,
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
      validateDashboardIdentifiers(output, ["REG-53"], [2025], undefined),
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
      validateDashboardIdentifiers(output, ["REG-53"], [2025], undefined),
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
      validateDashboardIdentifiers(output, ["REG-53"], [2025], undefined),
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
      validateDashboardIdentifiers(output, ["REG-53"], [2025], undefined),
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
      validateDashboardIdentifiers(output, ["REG-53"], [2025], chantiers),
    ).toThrow(/chantier_id non autorisé : CH-999/);
  });

  it("lève une erreur quand chantier_ids contient un id inconnu", () => {
    // given
    const chantiers: ChantierContext[] = [{ id: "CH-001", nom: "Chantier 1" }];
    const output: ComposeDashboardInput = {
      titre: "Cockpit",
      containers: [
        {
          widgets: [
            {
              type: "widget_cartographie_taux_avancement",
              maille: "regionale",
              territoire_code: "REG-53",
              jalon: 2025,
              chantier_ids: ["CH-001", "CH-999"],
            },
          ],
        },
      ],
    };

    // when / then
    expect(() =>
      validateDashboardIdentifiers(output, ["REG-53"], [2025], chantiers),
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
      validateDashboardIdentifiers(output, ["REG-53"], [2025], undefined),
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
      validateDashboardIdentifiers(output, ["REG-53"], [2025], chantiers),
    ).not.toThrow();
  });
});
