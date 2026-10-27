import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EncartSynthese } from "@/components/_commons/ChatUI/EncartSynthese";
import { ChantierLinksProvider } from "@/components/_commons/ChatUI/ChantierLinksContext";
import type { EncartOutput } from "@/server/albert/tools/encart";

const encart = (surcharge: Partial<EncartOutput>): EncartOutput => ({
  type: "synthese",
  jalon: 2025,
  date_redaction: "2026-10-27",
  markdown: "# Synthèse pour le Nord",
  termine: false,
  ...surcharge,
});

const renderEncart = (output: EncartOutput, isStreaming = true) =>
  render(
    <ChantierLinksProvider
      options={{ buildUrl: (chantierId) => `/chantier/${chantierId}` }}
    >
      <EncartSynthese isStreaming={isStreaming} output={output} />
    </ChantierLinksProvider>,
  );

describe("EncartSynthese", () => {
  test("pendant la rédaction, affiche l'en-tête, l'état et le texte déjà rédigé", () => {
    // When
    renderEncart(encart({ termine: false }));

    // Then
    expect(screen.getByText("Synthèse territoriale")).toBeInTheDocument();
    expect(screen.getByText("Jalon 2025")).toBeInTheDocument();
    expect(screen.getByText("27 octobre 2026")).toBeInTheDocument();
    expect(
      screen.getByText("À partir des données publiées dans PILOTE"),
    ).toBeInTheDocument();
    expect(screen.getByText("Rédaction en cours…")).toBeInTheDocument();
    expect(screen.getByText("Synthèse pour le Nord")).toBeInTheDocument();
  });

  test("une fois rédigé, n'affiche plus l'état de rédaction", () => {
    // When
    renderEncart(encart({ termine: true }));

    // Then
    expect(screen.queryByText("Rédaction en cours…")).not.toBeInTheDocument();
    expect(screen.getByText("Synthèse pour le Nord")).toBeInTheDocument();
  });

  test("une rédaction interrompue n'affiche pas d'état de rédaction", () => {
    // When
    renderEncart(encart({ termine: false }), false);

    // Then
    expect(screen.queryByText("Rédaction en cours…")).not.toBeInTheDocument();
    expect(screen.getByText("Synthèse pour le Nord")).toBeInTheDocument();
  });

  test("une fois rédigé, se télécharge en markdown avec le contenu affiché", async () => {
    // Given
    const fichiers: Blob[] = [];
    URL.createObjectURL = vi.fn((fichier: Blob) => {
      fichiers.push(fichier);
      return "blob:encart";
    });
    URL.revokeObjectURL = vi.fn();
    renderEncart(encart({ termine: true }), false);

    // When
    fireEvent.click(screen.getByRole("button", { name: /Télécharger/ }));

    // Then
    await waitFor(() => expect(fichiers).toHaveLength(1));
    expect(await fichiers[0].text()).toEqual("# Synthèse pour le Nord");
  });

  test("ne se télécharge pas pendant la rédaction", () => {
    // When
    renderEncart(encart({ termine: false }));

    // Then
    expect(
      screen.queryByRole("button", { name: /Télécharger/ }),
    ).not.toBeInTheDocument();
  });

  test("nomme la comparaison", () => {
    // When
    renderEncart(encart({ type: "comparaison", termine: true }));

    // Then
    expect(screen.getByText("Comparaison territoriale")).toBeInTheDocument();
  });

  test("n'affiche rien quand l'accès est refusé", () => {
    // When
    const { container } = renderEncart(
      encart({ markdown: "", termine: true, acces_refuse: true }),
    );

    // Then
    expect(container).toBeEmptyDOMElement();
  });
});
