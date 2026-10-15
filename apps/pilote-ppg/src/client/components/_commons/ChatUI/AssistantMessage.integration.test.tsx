import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AssistantMessage } from "@/components/_commons/ChatUI/AssistantMessage";
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
