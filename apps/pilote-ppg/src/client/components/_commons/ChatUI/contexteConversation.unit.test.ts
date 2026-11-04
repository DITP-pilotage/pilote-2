import type { ChatScenarios } from "@/components/_commons/ChatUI/ChatEmptyState";
import { contexteAAppliquer } from "@/components/_commons/ChatUI/contexteConversation";

const bretagne = {
  territoireCode: "REG-53",
  jalon: 2026,
  instructions: "Bretagne",
};
const auvergneRhoneAlpes = {
  territoireCode: "REG-84",
  jalon: 2026,
  instructions: "Auvergne-Rhône-Alpes",
};
const scenariosBretagne: ChatScenarios = { kind: "flat", scenarios: [] };
const scenariosAuvergneRhoneAlpes: ChatScenarios = {
  kind: "flat",
  scenarios: [],
};

describe("contexteAAppliquer", () => {
  test("une conversation vide prend le contexte de la page", () => {
    // When
    const contexte = contexteAAppliquer({
      conversation: { agentContext: bretagne, scenarios: scenariosBretagne },
      nombreMessages: 0,
      page: {
        agentContext: auvergneRhoneAlpes,
        scenarios: scenariosAuvergneRhoneAlpes,
      },
    });

    // Then
    expect(contexte).toStrictEqual({
      agentContext: auvergneRhoneAlpes,
      scenarios: scenariosAuvergneRhoneAlpes,
    });
  });

  test("une conversation commencée garde son contexte", () => {
    // When
    const contexte = contexteAAppliquer({
      conversation: { agentContext: bretagne, scenarios: scenariosBretagne },
      nombreMessages: 2,
      page: {
        agentContext: auvergneRhoneAlpes,
        scenarios: scenariosAuvergneRhoneAlpes,
      },
    });

    // Then
    expect(contexte).toBeNull();
  });

  test("ne change rien quand la conversation a déjà le contexte de la page", () => {
    // When
    const contexte = contexteAAppliquer({
      conversation: { agentContext: bretagne, scenarios: scenariosBretagne },
      nombreMessages: 0,
      page: { agentContext: bretagne, scenarios: scenariosBretagne },
    });

    // Then
    expect(contexte).toBeNull();
  });

  test("une conversation vide perd son contexte sur une page qui n'en donne pas", () => {
    // When
    const contexte = contexteAAppliquer({
      conversation: { agentContext: bretagne, scenarios: scenariosBretagne },
      nombreMessages: 0,
      page: null,
    });

    // Then
    expect(contexte).toStrictEqual({
      agentContext: undefined,
      scenarios: undefined,
    });
  });
});
