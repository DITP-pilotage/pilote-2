import type { ChatScenarios } from "@/components/_commons/ChatUI/ChatEmptyState";
import { scenariosChantier } from "@/components/PageChantier/scenariosChantier";

const comparaisons = (scenarios: ChatScenarios) =>
  scenarios.kind === "grouped"
    ? (scenarios.groups
        .find((groupe) => groupe.label === "Comparaison")
        ?.scenarios.map((scenario) => scenario.message) ?? [])
    : [];

describe("scenariosChantier", () => {
  test("compare un département aux autres départements de sa région", () => {
    // When
    const scenarios = scenariosChantier({
      chantierId: "CH-042",
      territoireCode: "DEPT-15",
      jalon: 2026,
    });

    // Then
    expect(comparaisons(scenarios)).toEqual([
      "Compare le CH-042 sur 15 - Cantal avec les autres départements de la région Auvergne-Rhône-Alpes",
      "Compare le CH-042 sur 15 - Cantal entre le jalon 2026 et ",
    ]);
  });

  test("compare une région à ses départements et aux autres régions", () => {
    // When
    const scenarios = scenariosChantier({
      chantierId: "CH-042",
      territoireCode: "REG-84",
      jalon: 2026,
    });

    // Then
    expect(comparaisons(scenarios)).toEqual([
      "Compare le CH-042 sur Auvergne-Rhône-Alpes avec ses départements",
      "Compare le CH-042 sur Auvergne-Rhône-Alpes avec les autres régions",
      "Compare le CH-042 sur Auvergne-Rhône-Alpes entre le jalon 2026 et ",
    ]);
  });

  test("compare les régions entre elles au national", () => {
    // When
    const scenarios = scenariosChantier({
      chantierId: "CH-042",
      territoireCode: "NAT-FR",
      jalon: 2026,
    });

    // Then
    expect(comparaisons(scenarios)).toEqual([
      "Compare le CH-042 entre les régions",
      "Compare le CH-042 sur France entre le jalon 2026 et ",
    ]);
  });
});
