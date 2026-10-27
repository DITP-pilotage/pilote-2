import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AssistantMessageText } from "@/components/_commons/ChatUI/AssistantMessageText";
import { ChantierLinksProvider } from "@/components/_commons/ChatUI/ChantierLinksContext";

const renderTexte = (text: string) =>
  render(
    <ChantierLinksProvider
      options={{ buildUrl: (chantierId) => `/chantier/${chantierId}` }}
    >
      <AssistantMessageText text={text} />
    </ChantierLinksProvider>,
  );

describe("AssistantMessageText", () => {
  test("rend un <br> écrit par le modèle comme un retour à la ligne, y compris dans un tableau", () => {
    // When
    const { container } = renderTexte(
      "| Indicateurs |\n|---|\n| IND-418 : 65 %<br>IND-420 : 59 %<br/>IND-417 : 2 060 |",
    );

    // Then
    expect(container.querySelectorAll("td br")).toHaveLength(2);
    expect(container).not.toHaveTextContent("<br");
  });

  test("n'interprète pas les autres balises", () => {
    // When
    const { container } = renderTexte("Texte <b>gras</b>");

    // Then
    expect(container.querySelector("b")).toBeNull();
  });
});
