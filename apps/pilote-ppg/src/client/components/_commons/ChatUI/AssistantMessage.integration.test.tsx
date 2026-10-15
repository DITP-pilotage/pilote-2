import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { userEvent } from "@testing-library/user-event";
import { AssistantMessage } from "@/components/_commons/ChatUI/AssistantMessage";
import { ChantierLinksProvider } from "@/components/_commons/ChatUI/ChantierLinksContext";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

vi.mock("next/router", async () => await vi.importActual("next-router-mock"));
vi.mock("@/components/_commons/ChatUI/AlbertConversationProvider", () => ({
  useAlbertConversation: () => ({ minimize: vi.fn() }),
}));

const messageAvecConsultation: PiloteUIMessage = {
  id: "message-1",
  role: "assistant",
  parts: [
    {
      type: "tool-consulter_centre_aide",
      toolCallId: "appel-1",
      state: "output-available",
      input: { question: "comment est calculé le taux d'avancement" },
      output: {
        trouve: true,
        reponse: "TA = (VA − VI) / (VC − VI)",
        sources: [
          {
            id: "taux",
            titre: "Le taux d'avancement",
            chemin: ["Introduction et notions clés"],
            url: "/centre-aide-pilote?article=taux",
          },
        ],
        _output_instructions: "",
      },
    },
  ],
};

test("n'affiche les pages du centre d'aide qu'une fois la réponse rédigée", () => {
  // When
  render(<AssistantMessage isStreaming message={messageAvecConsultation} />);

  // Then
  expect(
    screen.queryByText("Pour plus d'informations"),
  ).not.toBeInTheDocument();
});

test("affiche les pages du centre d'aide sous la réponse terminée", () => {
  // When
  render(
    <AssistantMessage isStreaming={false} message={messageAvecConsultation} />,
  );

  // Then
  expect(screen.getByText("Pour plus d'informations")).toBeInTheDocument();
});

test("copie les pages du centre d'aide avec le texte de la réponse", async () => {
  // Given
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  const message: PiloteUIMessage = {
    ...messageAvecConsultation,
    parts: [
      ...messageAvecConsultation.parts,
      { type: "text", text: "Le taux se calcule ainsi." },
    ],
  };
  render(
    <ChantierLinksProvider options={{ buildUrl: (id) => `/chantier/${id}` }}>
      <AssistantMessage isStreaming={false} message={message} />
    </ChantierLinksProvider>,
  );

  // When
  await userEvent.click(screen.getByRole("button", { name: /Copier/ }));

  // Then
  expect(writeText).toHaveBeenCalledWith(
    `Le taux se calcule ainsi.\n\nPour plus d'informations :\n- Le taux d'avancement : ${window.location.origin}/centre-aide-pilote?article=taux`,
  );
});
