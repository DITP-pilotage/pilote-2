import {
  convertirHtmlEnMarkdown,
  extraireIntertitres,
} from "@/server/parametrage-centre-aide/app/convertirHtmlEnMarkdown";

describe("convertirHtmlEnMarkdown", () => {
  it("convertit les titres et les paragraphes", () => {
    // Given
    const html = "<p>Introduction</p><h2>Calcul</h2><p>Le détail.</p>";

    // When
    const markdown = convertirHtmlEnMarkdown(html);

    // Then
    expect(markdown).toBe("Introduction\n\n## Calcul\n\nLe détail.");
  });

  it("déplie un accordéon sous son titre", () => {
    // Given
    const html =
      '<div data-type="accordion-item" data-title="Pour aller plus loin"><p>Contenu replié.</p></div>';

    // When
    const markdown = convertirHtmlEnMarkdown(html);

    // Then
    expect(markdown).toBe("#### Pour aller plus loin\n\nContenu replié.");
  });

  it("rend un callout en citation", () => {
    // Given
    const html =
      '<div data-type="callout" data-color="info"><p>Attention au jalon.</p></div>';

    // When
    const markdown = convertirHtmlEnMarkdown(html);

    // Then
    expect(markdown).toBe("> Attention au jalon.");
  });

  it("remplace une vidéo, même sans contenu, par une mention", () => {
    // Given
    const html =
      '<p>Avant</p><div data-type="video" data-src="https://tube.fr/v/1"></div><p>Après</p>';

    // When
    const markdown = convertirHtmlEnMarkdown(html);

    // Then
    expect(markdown).toBe(
      "Avant\n\n[Vidéo disponible sur la page]\n\nAprès",
    );
  });

  it("remplace une iframe par une mention de vidéo", () => {
    // Given
    const html = '<iframe src="https://tube.fr/v/2"></iframe>';

    // When
    const markdown = convertirHtmlEnMarkdown(html);

    // Then
    expect(markdown).toBe("[Vidéo disponible sur la page]");
  });

  it("décrit une image par son texte alternatif", () => {
    // Given
    const html =
      '<p>Voir <img src="/capture.png" alt="Écran d\'import"> ci-dessus</p><p><img src="/sans-alt.png"></p>';

    // When
    const markdown = convertirHtmlEnMarkdown(html);

    // Then
    expect(markdown).toBe(
      "Voir [Image : Écran d'import] ci-dessus\n\n[Image disponible sur la page]",
    );
  });

  it("supprime les icônes décoratives", () => {
    // Given
    const html =
      '<p><span data-type="icone" data-icon-type="InformationPleineIcon"></span>Information</p>';

    // When
    const markdown = convertirHtmlEnMarkdown(html);

    // Then
    expect(markdown).toBe("Information");
  });
});

describe("extraireIntertitres", () => {
  it("garde les titres de niveau 1 à 3, dans l'ordre", () => {
    // Given
    const markdown =
      "# Vue d'ensemble\n\ntexte\n\n## Calcul\n\n### Cas particulier\n\n#### Pour aller plus loin";

    // When
    const intertitres = extraireIntertitres(markdown);

    // Then
    expect(intertitres).toEqual([
      "Vue d'ensemble",
      "Calcul",
      "Cas particulier",
    ]);
  });
});
