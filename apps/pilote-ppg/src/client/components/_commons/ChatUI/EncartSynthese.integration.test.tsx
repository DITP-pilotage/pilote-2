import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EncartSynthese } from "@/components/_commons/ChatUI/EncartSynthese";
import { ChantierLinksProvider } from "@/components/_commons/ChatUI/ChantierLinksContext";
import { imprimerEncart } from "@/components/_commons/ChatUI/exporterEncart";
import type { EncartOutput } from "@/server/albert/tools/encart";

vi.mock(
  "@/components/_commons/ChatUI/exporterEncart",
  async (importOriginal) => ({
    ...(await importOriginal()),
    imprimerEncart: vi.fn().mockResolvedValue(undefined),
  }),
);

const encart = (surcharge: Partial<EncartOutput>): EncartOutput => ({
  type: "synthese",
  jalon: 2025,
  date_redaction: "2026-10-27T10:00:00.000Z",
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

// Le menu « Exporter » (radix) se positionne avec ResizeObserver, absent de jsdom.
class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const ouvrirExporter = () =>
  fireEvent.keyDown(screen.getByRole("button", { name: /Exporter/ }), {
    key: "Enter",
  });

describe("EncartSynthese", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("avant l'arrivée du texte, affiche l'en-tête et l'état de rédaction", () => {
    // When
    renderEncart(encart({ markdown: "", termine: false }));

    // Then
    expect(screen.getByText("Synthèse territoriale")).toBeInTheDocument();
    expect(screen.getByText("Jalon 2025")).toBeInTheDocument();
    expect(screen.getByText("27 octobre 2026")).toBeInTheDocument();
    expect(
      screen.getByText("À partir des données publiées dans PILOTE"),
    ).toBeInTheDocument();
    expect(screen.getByText("Rédaction en cours…")).toBeInTheDocument();
  });

  test("dès que le texte arrive, affiche le texte sans l'état de rédaction", () => {
    // When
    renderEncart(encart({ termine: false }));

    // Then
    expect(screen.queryByText("Rédaction en cours…")).not.toBeInTheDocument();
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
    renderEncart(encart({ markdown: "", termine: false }), false);

    // Then
    expect(screen.queryByText("Rédaction en cours…")).not.toBeInTheDocument();
  });

  test("une fois rédigé, s'exporte en markdown dans le presse-papiers", async () => {
    // Given
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderEncart(encart({ termine: true }), false);

    // When
    ouvrirExporter();
    fireEvent.click(
      await screen.findByRole("menuitem", { name: /Copier le texte/ }),
    );

    // Then
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("# Synthèse pour le Nord"),
    );
  });

  test("une fois rédigé, se télécharge en PDF sous le nom de son titre", async () => {
    // When
    renderEncart(encart({ termine: true }), false);
    ouvrirExporter();
    fireEvent.click(
      await screen.findByRole("menuitem", { name: /Télécharger en PDF/ }),
    );

    // Then
    await waitFor(() =>
      expect(imprimerEncart).toHaveBeenCalledWith({
        encart: screen.getByRole("article"),
        titre: "synthese-pour-le-nord",
      }),
    );
  });

  test("ne s'exporte pas pendant la rédaction", () => {
    // When
    renderEncart(encart({ termine: false }));

    // Then
    expect(
      screen.queryByRole("button", { name: /Exporter/ }),
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
