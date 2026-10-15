import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  CentreAideEncart,
  derniereConsultationCentreAide,
} from "@/components/_commons/ChatUI/CentreAideEncart";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

vi.mock("next/router", async () => await vi.importActual("next-router-mock"));
vi.mock("@/components/_commons/ChatUI/AlbertConversationProvider", () => ({
  useAlbertConversation: () => ({ minimize: vi.fn() }),
}));

const SOURCE_TAUX = {
  id: "taux",
  titre: "Le taux d'avancement",
  chemin: ["Introduction et notions clés"],
  url: "/centre-aide-pilote?article=taux",
};

test("liste les pages utilisées avec leur emplacement dans le centre d'aide", () => {
  // Given
  const output = {
    trouve: true,
    reponse: "TA = (VA − VI) / (VC − VI)",
    sources: [SOURCE_TAUX],
    _output_instructions: "",
  };

  // When
  render(<CentreAideEncart output={output} />);

  // Then
  expect(screen.getByText("Pour plus d'informations")).toBeInTheDocument();
  expect(screen.getByText("Introduction et notions clés")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /Le taux d'avancement/ }),
  ).toHaveAttribute("href", "/centre-aide-pilote?article=taux");
});

test("propose de contacter l'équipe PILOTE quand le centre d'aide ne répond pas", () => {
  // Given
  const output = {
    trouve: false,
    reponse: "",
    sources: [],
    _output_instructions: "",
  };

  // When
  render(<CentreAideEncart output={output} />);

  // Then
  expect(
    screen.getByRole("link", { name: /Contacter l'équipe PILOTE/ }),
  ).toHaveAttribute("href", "mailto:pilote.ditp@modernisation.gouv.fr");
  expect(
    screen.queryByText("Pour plus d'informations"),
  ).not.toBeInTheDocument();
});

test("ne retient que la dernière consultation du centre d'aide d'un message", () => {
  // Given
  const consultation = (id: string, titre: string) => ({
    type: "tool-consulter_centre_aide" as const,
    toolCallId: id,
    state: "output-available" as const,
    input: { question: titre },
    output: {
      trouve: true,
      reponse: titre,
      sources: [{ ...SOURCE_TAUX, id, titre }],
      _output_instructions: "",
    },
  });
  const parts: PiloteUIMessage["parts"] = [
    consultation("premiere", "Première"),
    { type: "text", text: "Réponse" },
    consultation("seconde", "Seconde"),
  ];

  // When
  const derniere = derniereConsultationCentreAide(parts);

  // Then
  expect(derniere?.reponse).toBe("Seconde");
});
