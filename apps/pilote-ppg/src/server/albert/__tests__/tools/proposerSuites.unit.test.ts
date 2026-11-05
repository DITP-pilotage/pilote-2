import { describe, expect, it } from "vitest";
import type { ModelMessage } from "ai";
import { suitesEligibles } from "@/server/albert/tools/proposerSuites";

const QUESTION_TAUX = "Quel est le taux d'avancement de la Bretagne ?";

describe("suitesEligibles", () => {
  it("garde deux suites au plus", () => {
    // When
    const suites = suitesEligibles({
      suites: [
        { label: "Quels chantiers sont en retard en Bretagne ?" },
        { label: "Fais-moi la synthèse de la Bretagne" },
        { label: "Compare la Bretagne aux autres régions" },
      ],
      messages: [],
    });

    // Then
    expect(suites).toEqual([
      { label: "Quels chantiers sont en retard en Bretagne ?" },
      { label: "Fais-moi la synthèse de la Bretagne" },
    ]);
  });

  it("écarte une question déjà posée dans la conversation", () => {
    // Given
    const messages: ModelMessage[] = [
      { role: "user", content: QUESTION_TAUX },
      { role: "assistant", content: "Le taux est de 51 %." },
      {
        role: "user",
        content: [{ type: "text", text: "Et ses chantiers en retard ?" }],
      },
    ];

    // When
    const suites = suitesEligibles({
      suites: [
        { label: "quel est le taux d'avancement de la Bretagne" },
        { label: "Et ses chantiers en retard ?" },
        { label: "Fais-moi la synthèse de la Bretagne" },
      ],
      messages,
    });

    // Then
    expect(suites).toEqual([{ label: "Fais-moi la synthèse de la Bretagne" }]);
  });

  it("écarte les doublons et les libellés vides", () => {
    // When
    const suites = suitesEligibles({
      suites: [
        { label: "Fais-moi la synthèse de la Bretagne" },
        { label: "  " },
        { label: "Fais-moi la synthèse de la Bretagne." },
      ],
      messages: [],
    });

    // Then
    expect(suites).toEqual([{ label: "Fais-moi la synthèse de la Bretagne" }]);
  });
});
