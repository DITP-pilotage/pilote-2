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
    expect(markdown).toBe("Avant\n\n[Vidéo disponible sur la page]\n\nAprès");
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

  it("garde sur sa ligne un titre qui commence par un saut de ligne", () => {
    // Given
    // Fréquent dans le centre d'aide réel : `<h4><br>Titre</h4>`
    const html =
      "<h4><br>Introduction : quels types de données ?</h4><p>Texte</p>";

    // When
    const markdown = convertirHtmlEnMarkdown(html);

    // Then
    expect(markdown).toBe(
      "#### Introduction : quels types de données ?\n\nTexte",
    );
  });

  it("rend un saut de ligne par un simple retour, sans lignes vides superflues", () => {
    // Given
    const html =
      "<p>Ligne 1<br>Ligne 2<br><br></p><p><br></p><p></p><p>Suite</p>";

    // When
    const markdown = convertirHtmlEnMarkdown(html);

    // Then
    expect(markdown).toBe("Ligne 1\nLigne 2\n\nSuite");
  });

  it("n'échappe pas le texte, qui n'est lu que par le LLM", () => {
    // Given
    const html = "<p>1. La liste</p><p>- Directeurs de projet</p>";

    // When
    const markdown = convertirHtmlEnMarkdown(html);

    // Then
    expect(markdown).toBe("1. La liste\n\n- Directeurs de projet");
  });
});

describe("extraireIntertitres", () => {
  it("garde les titres de tous niveaux, dans l'ordre et sans doublon", () => {
    // Given
    // Le centre d'aide réel structure ses pages en h4 à h6, et ses accordéons
    // portent souvent le même titre (« Procédure »).
    const markdown =
      "# Vue d'ensemble\n\ntexte\n\n#### Procédure\n\n#### Procédure\n\n###### Quelle fréquence de mise à jour ?";

    // When
    const intertitres = extraireIntertitres(markdown);

    // Then
    expect(intertitres).toEqual([
      "Vue d'ensemble",
      "Procédure",
      "Quelle fréquence de mise à jour ?",
    ]);
  });
});
