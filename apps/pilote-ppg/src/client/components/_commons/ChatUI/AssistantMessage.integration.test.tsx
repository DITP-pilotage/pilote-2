import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AssistantMessage } from "@/components/_commons/ChatUI/AssistantMessage";
import { ChantierLinksProvider } from "@/components/_commons/ChatUI/ChantierLinksContext";
import { ChatContextProvider } from "@/components/_commons/ChatUI/ChatContext";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

vi.mock("html-to-image", () => ({
  toBlob: async () => new Blob(["png"], { type: "image/png" }),
}));

class FakeClipboardItem {
  readonly items: Record<string, Promise<Blob>>;

  constructor(items: Record<string, Promise<Blob>>) {
    this.items = items;
  }
}

const reponseAvecDashboard: PiloteUIMessage = {
  id: "assistant-1",
  role: "assistant",
  parts: [
    { type: "text", text: "Voici le tableau de bord demandé." },
    {
      type: "tool-create_dashboard",
      toolCallId: "call-dashboard",
      state: "output-available",
      input: { task: "Synthèse", territoire_codes: ["NAT-FR"], jalons: [2026] },
      output: { titre: "Synthèse", containers: [] },
    },
  ],
};

const renderMessage = (message: PiloteUIMessage) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ChantierLinksProvider
        options={{ buildUrl: (chantierId) => `/chantier/${chantierId}` }}
      >
        <AssistantMessage isStreaming={false} message={message} />
      </ChantierLinksProvider>
    </QueryClientProvider>,
  );

describe("AssistantMessage", () => {
  const writeText = vi.fn<(text: string) => Promise<void>>();
  const write = vi.fn<(items: FakeClipboardItem[]) => Promise<void>>();

  beforeEach(() => {
    writeText.mockReset().mockResolvedValue();
    write.mockReset().mockResolvedValue();
    vi.stubGlobal("ClipboardItem", FakeClipboardItem);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { write, writeText },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("« Copier le texte » ne copie que le texte d'une réponse avec dashboard", async () => {
    // Given
    renderMessage(reponseAvecDashboard);

    // When
    fireEvent.click(screen.getByRole("button", { name: /copier le texte/i }));

    // Then
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "Voici le tableau de bord demandé.",
      ),
    );
    expect(write).not.toHaveBeenCalled();
  });

  test("« Copier l'image » ne copie que l'image du dashboard", async () => {
    // Given
    renderMessage(reponseAvecDashboard);

    // When
    fireEvent.click(screen.getByRole("button", { name: /copier l'image/i }));

    // Then
    await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    const [[[item]]] = write.mock.calls;
    expect(Object.keys(item.items)).toEqual(["image/png"]);
    expect(writeText).not.toHaveBeenCalled();
  });

  test("ne propose pas de copier l'image d'une réponse sans dashboard", () => {
    // Given
    const reponseTexte: PiloteUIMessage = {
      ...reponseAvecDashboard,
      parts: [{ type: "text", text: "Réponse" }],
    };

    // When
    renderMessage(reponseTexte);

    // Then
    expect(
      screen.getByRole("button", { name: /copier le texte/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /copier l'image/i }),
    ).not.toBeInTheDocument();
  });

  describe("suites", () => {
    const partSuites = (labels: string[], toolCallId: string) => ({
      type: "tool-proposer_suites" as const,
      toolCallId,
      state: "output-available" as const,
      input: { suites: labels.map((label) => ({ label })) },
      output: { suites: labels.map((label) => ({ label })) },
    });

    const reponseAvecSuites: PiloteUIMessage = {
      id: "assistant-2",
      role: "assistant",
      parts: [
        partSuites(["Synthèse de la Bretagne"], "call-1"),
        { type: "text", text: "Le taux de la Bretagne est de 51 %." },
        partSuites(["Chantiers en retard en Bretagne"], "call-2"),
      ],
    };

    const renderAvecSuites = ({ afficherChoix }: { afficherChoix: boolean }) =>
      render(
        <QueryClientProvider client={new QueryClient()}>
          <ChatContextProvider
            error={undefined}
            fillInput={vi.fn()}
            sendMessage={vi.fn()}
            status="ready"
            stop={vi.fn()}
            track={vi.fn()}
          >
            <ChantierLinksProvider
              options={{ buildUrl: (chantierId) => `/chantier/${chantierId}` }}
            >
              <AssistantMessage
                afficherChoix={afficherChoix}
                isStreaming={false}
                message={reponseAvecSuites}
              />
            </ChantierLinksProvider>
          </ChatContextProvider>
        </QueryClientProvider>,
      );

    test("affiche les dernières suites proposées sous la réponse", () => {
      // When
      renderAvecSuites({ afficherChoix: true });

      // Then
      expect(
        screen.getByRole("button", {
          name: /chantiers en retard en bretagne/i,
        }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /synthèse de la bretagne/i }),
      ).not.toBeInTheDocument();
    });

    test("n'affiche pas les suites d'une réponse qui n'est plus la dernière", () => {
      // When
      renderAvecSuites({ afficherChoix: false });

      // Then
      expect(
        screen.queryByRole("region", { name: /pour aller plus loin/i }),
      ).not.toBeInTheDocument();
    });
  });
});
