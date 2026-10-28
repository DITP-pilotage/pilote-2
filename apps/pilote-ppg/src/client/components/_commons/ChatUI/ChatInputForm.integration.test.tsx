import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ChatInputForm } from "@/components/_commons/ChatUI/ChatInputForm";

vi.mock("@/components/_commons/ChatUI/ChatContext", () => ({
  useChatContext: () => ({
    sendMessage: vi.fn(),
    status: "ready",
    stop: vi.fn(),
    track: vi.fn(),
  }),
}));

vi.mock("@/components/_commons/ChatUI/useSpeechRecognition", () => ({
  useSpeechRecognition: () => ({
    state: "inactive",
    isSupported: true,
    toggle: vi.fn(),
  }),
}));

const renderFormulaire = () =>
  render(
    <ChatInputForm
      fillInputRef={{ current: null }}
      placeholder="Votre question"
    />,
  );

describe("ChatInputForm", () => {
  test("ne propose pas de choix de modèle", () => {
    // When
    renderFormulaire();

    // Then
    expect(screen.queryByText("GPT-OSS 120B")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  test("place la dictée juste à gauche de l'envoi", () => {
    // When
    renderFormulaire();

    // Then
    const dictee = screen.getByRole("button", { name: "Dicter un message" });
    const envoi = screen.getByRole("button", { name: "Envoyer le message" });
    expect(dictee.parentElement).toBe(envoi.parentElement);
    expect(dictee.nextElementSibling).toBe(envoi);
  });
});
