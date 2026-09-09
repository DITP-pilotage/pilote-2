import { render, screen } from "@testing-library/react";
import { AssistantMessageText } from "@/components/_commons/ChatUI/AssistantMessageText";
import { ChatContextProvider } from "@/components/_commons/ChatUI/ChatContext";
import type { ChantierCite } from "@/components/_commons/ChatUI/extraireChantiersCites";

vi.mock("next/router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/_commons/ChatUI/AlbertConversationProvider", () => ({
  useAlbertConversation: () => ({ minimiser: vi.fn() }),
}));

const chantiers = new Map<string, ChantierCite>([
  ["CH-050", { id: "CH-050", nom: "Sécurité routière" }],
]);

const afficher = (texte: string) =>
  render(
    <ChatContextProvider
      error={undefined}
      fillInput={() => {}}
      optionsLiensChantiers={{
        chantiers,
        construireUrl: (chantier) => `/chantier/${chantier.id}/NAT-FR`,
      }}
      sendMessage={() => {}}
      status="ready"
      stop={() => {}}
    >
      <AssistantMessageText text={texte} />
    </ChatContextProvider>,
  );

describe("AssistantMessageText", () => {
  test("rend un lien interne pour un chantier de la whitelist", () => {
    // Given
    const texte = "Voir **CH-050 — Sécurité routière** pour le détail.";

    // When
    afficher(texte);

    // Then
    expect(
      screen.getByRole("link", { name: "CH-050 — Sécurité routière" }),
    ).toHaveAttribute("href", "/chantier/CH-050/NAT-FR");
  });

  test("laisse en texte un chantier absent de la whitelist", () => {
    // Given
    const texte = "Le chantier CH-999 n'existe pas.";

    // When
    afficher(texte);

    // Then
    expect(screen.queryByRole("link")).toBeNull();
  });
});
