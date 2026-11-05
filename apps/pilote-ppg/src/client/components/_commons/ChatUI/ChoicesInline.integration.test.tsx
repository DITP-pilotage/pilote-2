import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { ComponentProps } from "react";
import { ChatContextProvider } from "@/components/_commons/ChatUI/ChatContext";
import { ChoicesInline } from "@/components/_commons/ChatUI/ChoicesInline";

const sendMessage = vi.fn();
const track = vi.fn();

const renderChoices = (props: ComponentProps<typeof ChoicesInline>) =>
  render(
    <ChatContextProvider
      error={undefined}
      fillInput={vi.fn()}
      sendMessage={sendMessage}
      status="ready"
      stop={vi.fn()}
      track={track}
    >
      <ChoicesInline {...props} />
    </ChatContextProvider>,
  );

const SUITES = [
  { label: "Quels chantiers sont en retard en Bretagne ?" },
  { label: "Fais-moi la synthèse de la Bretagne" },
];

describe("ChoicesInline en suites", () => {
  beforeEach(() => {
    sendMessage.mockReset();
    track.mockReset();
  });

  test("présente les suites pour aller plus loin, sans autre demande à écrire", () => {
    // When
    renderChoices({ variante: "suites", choices: SUITES, llmCallId: "llm-1" });

    // Then
    expect(
      screen.getByRole("region", { name: /pour aller plus loin/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button").map((button) => button.textContent),
    ).toEqual([
      "Quels chantiers sont en retard en Bretagne ?",
      "Fais-moi la synthèse de la Bretagne",
    ]);
  });

  test("envoie la suite cliquée comme une demande", () => {
    // Given
    renderChoices({ variante: "suites", choices: SUITES, llmCallId: "llm-1" });

    // When
    fireEvent.click(
      screen.getByRole("button", { name: /synthèse de la Bretagne/i }),
    );

    // Then
    expect(sendMessage).toHaveBeenCalledWith({
      text: "Fais-moi la synthèse de la Bretagne",
    });
    expect(track).toHaveBeenCalledWith({
      action: "select",
      name: "response.suite",
      dimensions: { llm_call_id: "llm-1", position_choix: 2 },
    });
  });

  test("la clarification garde sa question et l'autre demande à écrire", () => {
    // When
    renderChoices({
      question: "Quel territoire ?",
      choices: [{ label: "La Bretagne" }, { label: "Le Finistère" }],
      llmCallId: "llm-1",
    });

    // Then
    expect(
      screen.getByRole("region", { name: /précisez votre demande/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /écrire ma demande/i }),
    ).toBeInTheDocument();
  });
});
