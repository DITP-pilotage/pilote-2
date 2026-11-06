import { fireEvent, screen, waitFor } from "@testing-library/react";
import { render } from "@/components/shared/DataTable/testUtils";
import "@testing-library/jest-dom";
import { AssistantMessage } from "@/components/_commons/ChatUI/AssistantMessage";
import { ChantierLinksProvider } from "@/components/_commons/ChatUI/ChantierLinksContext";
import { ChatContextProvider } from "@/components/_commons/ChatUI/ChatContext";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import type { LigneACompleter } from "@/server/albert/tools/indicateursACompleter";

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
    <ChantierLinksProvider
      options={{ buildUrl: (chantierId) => `/chantier/${chantierId}` }}
    >
      <AssistantMessage isStreaming={false} message={message} />
    </ChantierLinksProvider>,
  );

const ligneACompleter = (numero: number): LigneACompleter => ({
  chantier_id: "CH-018",
  chantier_nom: "Accès aux soins",
  indicateur_id: `IND-${numero}`,
  indicateur_nom: `Indicateur ${numero}`,
  territoire_code: "REG-53",
  territoire_nom: "Bretagne",
  territoire_nom_affiche: "Bretagne",
  maille: "REG",
  motifs: ["VA non à jour"],
  date_derniere_valeur: null,
  mise_a_jour_attendue_depuis: null,
});

const reponseAvecDetail = (nombreLignes: number): PiloteUIMessage => ({
  id: "assistant-2",
  role: "assistant",
  parts: [
    {
      type: "tool-get_indicateurs_a_completer",
      toolCallId: "call-detail",
      state: "output-available",
      input: { motifs: ["va"] },
      output: {
        resume: { perimetre: "Bretagne et ses départements", chantiers: [] },
        detail: {
          motifs: ["va"],
          perimetre: "Bretagne et ses départements",
          lignes: Array.from({ length: nombreLignes }, (_, index) =>
            ligneACompleter(index + 1),
          ),
        },
      },
    },
  ],
});

const partClarification = (
  toolCallId: string,
  question: string,
): PiloteUIMessage["parts"][number] => ({
  type: "tool-clarify_with_choices",
  toolCallId,
  state: "output-available",
  input: { question, choices: [] },
  output: { question, choices: [{ label: `Choix ${question}`, value: "oui" }] },
});

const partClarificationACompleter = (
  toolCallId: string,
  question: string,
): PiloteUIMessage["parts"][number] => ({
  type: "tool-get_indicateurs_a_completer",
  toolCallId,
  state: "output-available",
  input: { motifs: ["va", "vi", "vc"] },
  output: {
    clarification: {
      question,
      choices: [{ label: `Choix ${question}`, value: "oui" }],
    },
  },
});

const renderAvecChoix = (message: PiloteUIMessage) =>
  render(
    <ChatContextProvider
      error={undefined}
      fillInput={vi.fn()}
      sendMessage={vi.fn()}
      status="ready"
      stop={vi.fn()}
      track={vi.fn()}
    >
      <AssistantMessage afficherChoix isStreaming={false} message={message} />
    </ChatContextProvider>,
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

  test("affiche le tableau replié avec une ligne", () => {
    // Given
    const reponse = reponseAvecDetail(1);

    // When
    renderMessage(reponse);

    // Then
    expect(
      screen.getByText(
        "Détail par territoire · Bretagne et ses départements · VA non à jour · 1 ligne · 1 chantier",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Afficher le détail").closest("details"),
    ).not.toHaveAttribute("open");
  });

  test("n'affiche pas de tableau sans ligne", () => {
    // Given
    const reponse = reponseAvecDetail(0);

    // When
    renderMessage(reponse);

    // Then
    expect(screen.queryByText(/Détail par territoire/)).not.toBeInTheDocument();
  });

  test("n'affiche pas de tableau pendant le streaming", () => {
    // Given
    const reponse = reponseAvecDetail(1);

    // When
    render(<AssistantMessage isStreaming message={reponse} />);

    // Then
    expect(screen.queryByText(/Détail par territoire/)).not.toBeInTheDocument();
  });

  test("n'affiche pas de tableau sur une clarification", () => {
    // Given
    const reponse: PiloteUIMessage = {
      id: "assistant-3",
      role: "assistant",
      parts: [
        {
          type: "tool-get_indicateurs_a_completer",
          toolCallId: "call-clarification",
          state: "output-available",
          input: { motifs: ["va", "vi", "vc"] },
          output: {
            clarification: {
              question: "Quelles valeurs ?",
              choices: [{ label: "Valeurs d'avancement", value: "va" }],
            },
          },
        },
      ],
    };

    // When
    renderAvecChoix(reponse);

    // Then
    expect(screen.queryByText(/Détail par territoire/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Valeurs d'avancement/ }),
    ).toBeInTheDocument();
  });

  test("ne présente que les choix de la dernière question", () => {
    // Given
    const reponse: PiloteUIMessage = {
      id: "assistant-4",
      role: "assistant",
      parts: [
        partClarification("call-1", "première"),
        partClarification("call-2", "seconde"),
      ],
    };

    // When
    renderAvecChoix(reponse);

    // Then
    expect(
      screen.queryByRole("button", { name: /Choix première/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Choix seconde/ }),
    ).toBeInTheDocument();
  });

  test("ne présente que les choix de la dernière clarification de get_indicateurs_a_completer", () => {
    // Given
    const reponse: PiloteUIMessage = {
      id: "assistant-5",
      role: "assistant",
      parts: [
        partClarificationACompleter("call-1", "première"),
        partClarificationACompleter("call-2", "seconde"),
      ],
    };

    // When
    renderAvecChoix(reponse);

    // Then
    expect(
      screen.queryByRole("button", { name: /Choix première/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Choix seconde/ }),
    ).toBeInTheDocument();
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
        </ChatContextProvider>,
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
